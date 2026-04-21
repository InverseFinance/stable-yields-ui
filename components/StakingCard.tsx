'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useBalance } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { useConnectModal, useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { DOLA_ADDRESS, SDOLA_ADDRESS, ERC20_ABI, ERC4626_ABI } from '@/lib/contracts';
import { formatBalance, formatTokenAmount, formatUsd, smartShortNumber } from '@/lib/utils';
import { SUPPORTED_TOKENS, isDola, isNativeEth, DOLA_TOKEN, type SupportedToken } from '@/lib/tokens';
import { TokenSelector } from './TokenSelector';
import { useEnsoRoute } from '@/hooks/useEnsoRoute';
import { FEE_BPS, fetchEnsoApproval, fetchEnsoBalances } from '@/lib/enso';
import { SavingsOpportunites, SelectedOpportunity } from './SavingsOpportunities';
import { gaEvent } from '@/lib/analytics';
import { addTxToast } from '@/lib/toastStore';
import { useLanguage } from '@/lib/useLanguage';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { TermsModal, TOS_STORAGE_KEY } from './TermsOfServices';
import { WorthDiffWarning } from './WorthDiffWarning';
import { SlippageSelector, type SlippageSetting } from './SlippageSelector';
import { StakingData } from '@/app/types';

type Tab = 'stake' | 'unstake';
type EnsoStep = 'idle' | 'approving' | 'routing';

const PRIORITY_ADDRS = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
];

function getDefaultToken(tokens: SupportedToken[]): SupportedToken {
  const withBal = tokens.filter(t => t.usd > 0);
  const bestIdle = withBal.find(t => t.isIdleStable);
  if (bestIdle) return bestIdle;
  const bestPriority = withBal.find(t => PRIORITY_ADDRS.some(a => a.toLowerCase() === t.address.toLowerCase()));
  if (bestPriority) return bestPriority;
  return tokens[0];
}

function withDefaultPrices(tokens: SupportedToken[], prices: TokenPrices): SupportedToken[] {
  return tokens.map(t => ({
    ...t,
    price: prices[t.address.toLowerCase()] ?? t.price,
  }));
}

export function StakingCard({ stakingData, tokenPrices = {} }: { stakingData: StakingData; tokenPrices?: TokenPrices }) {
  const [activeTab, setActiveTab] = useState<Tab>('stake');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(() => withDefaultPrices(SUPPORTED_TOKENS, tokenPrices)[0]);
  const [sortedTokens, setSortedTokens] = useState<SupportedToken[]>(() => withDefaultPrices(SUPPORTED_TOKENS, tokenPrices));
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [maxAmounts, setMaxAmounts] = useState<Record<string, string>>({});
  const [ensoStep, setEnsoStep] = useState<EnsoStep>('idle');
  const [withdrawDestToken, setWithdrawDestToken] = useState<SupportedToken>(() => {
    return withDefaultPrices(SUPPORTED_TOKENS, tokenPrices).find(t => t.symbol === 'USDC')!;
  });
  const [isMaxWithdraw, setIsMaxWithdraw] = useState(false);
  const [slippageSetting, setSlippageSetting] = useState<SlippageSetting>('auto');
  const [showTosModal, setShowTosModal] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const addRecentTransaction = useAddRecentTransaction();
  const { t } = useLanguage();

  const isDolaToSDola = isDola(selectedToken.address) && ((stakingData?.zapAddress || stakingData?.address) === SDOLA_ADDRESS)

  // ── DOLA direct flow reads ──

  const { data: dolaBalance, refetch: refetchDola } = useReadContract({
    address: DOLA_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: sdolaBalance, refetch: refetchSdola } = useReadContract({
    address: SDOLA_ADDRESS,
    abi: ERC4626_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: DOLA_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, SDOLA_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // ── Selected non-DOLA ERC20 balance (for max / insufficient check) ──

  const { data: selectedTokenBalance, refetch: refetchSelectedBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && activeTab === 'stake' && !isNativeEth(selectedToken.address),
    },
  });

  // ── Native ETH balance ──

  const { data: ethBalanceData } = useBalance({ address, query: { enabled: !!address } });

  // ── Parsed amount (DOLA terms for unstake, token terms for stake) ──

  const parsedAmount = (() => {
    try {
      return amount && parseFloat(amount) > 0 ? parseUnits(amount, activeTab === 'stake' ? selectedToken.decimals : 18) : 0n;
    } catch {
      return 0n;
    }
  })();

  const amountInWei = parsedAmount > 0n ? parsedAmount.toString() : '0';

  // ── Withdraw: convert DOLA input → sDOLA shares for routing ──

  const { data: withdrawSdolaAmount } = useReadContract({
    address: SDOLA_ADDRESS,
    abi: ERC4626_ABI,
    functionName: 'convertToShares',
    args: [parsedAmount],
    query: { enabled: activeTab === 'unstake' && !isMaxWithdraw && parsedAmount > 0n },
  });

  // ── Withdraw: DOLA equivalent of full sDOLA balance (for MAX display) ──

  const { data: sdolaBalanceInDola } = useReadContract({
    address: SDOLA_ADDRESS,
    abi: ERC4626_ABI,
    functionName: 'convertToAssets',
    args: [sdolaBalance ?? 0n],
    query: { enabled: activeTab === 'unstake' && !!address && (sdolaBalance ?? 0n) > 0n },
  });

  // ── Computed sDOLA amount for withdrawal ──

  const sdolaWithdrawBN: bigint = isMaxWithdraw
    ? (sdolaBalance ?? 0n)
    : (withdrawSdolaAmount ?? 0n);
  const sdolaWithdrawAmountWei = sdolaWithdrawBN > 0n ? sdolaWithdrawBN.toString() : '0';

  // ── Balance / insufficiency (computed early for canAutoRefresh) ──

  const stakeBalance = isDola(selectedToken.address)
    ? dolaBalance
    : isNativeEth(selectedToken.address)
      ? ethBalanceData?.value
      : selectedTokenBalance;

  const insufficientBalance = parsedAmount > 0n && (
    activeTab === 'stake'
      ? (stakeBalance !== undefined && parsedAmount > stakeBalance)
      : (!isMaxWithdraw && sdolaBalance !== undefined && sdolaWithdrawBN > 0n && sdolaWithdrawBN > sdolaBalance)
  );

  // ── Enso routes ──

  const usingEnsoDeposit = activeTab === 'stake'
  const usingEnsoWithdraw = activeTab === 'unstake' && !isDola(withdrawDestToken.address);

  const depositSlippage = slippageSetting === 'auto'
    ? (selectedToken.isStablish ? '3' : '30')
    : slippageSetting;

  const withdrawSlippage = slippageSetting === 'auto'
    ? (withdrawDestToken.isStablish ? '3' : '30')
    : slippageSetting;

  const canAutoRefreshDeposit = usingEnsoDeposit && ensoStep === 'idle' && parsedAmount > 0n && !insufficientBalance;
  const canAutoRefreshWithdraw = usingEnsoWithdraw && ensoStep === 'idle' && sdolaWithdrawBN > 0n && !insufficientBalance;

  const ensoDepositRoute = useEnsoRoute(
    usingEnsoDeposit ? selectedToken.address : undefined,
    amountInWei,
    address,
    depositSlippage,
    stakingData?.zapAddress || stakingData?.address,
    canAutoRefreshDeposit,
  );

  const ensoWithdrawRoute = useEnsoRoute(
    usingEnsoWithdraw && sdolaWithdrawBN > 0n ? SDOLA_ADDRESS : undefined,
    sdolaWithdrawAmountWei,
    address,
    withdrawSlippage,
    withdrawDestToken.address,
    canAutoRefreshWithdraw,
  );

  // ── Enso allowance reads (to skip approval if already sufficient) ──

  const ensoDepositSpender = ensoDepositRoute.tx?.to as `0x${string}` | undefined;
  const { data: ensoDepositAllowance, refetch: refetchEnsoDepositAllowance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && ensoDepositSpender ? [address, ensoDepositSpender] : undefined,
    query: { enabled: !!address && !!ensoDepositSpender && activeTab === 'stake' && !isNativeEth(selectedToken.address) },
  });

  const ensoWithdrawSpender = ensoWithdrawRoute.tx?.to as `0x${string}` | undefined;
  const { data: ensoWithdrawAllowance, refetch: refetchEnsoWithdrawAllowance } = useReadContract({
    address: SDOLA_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && ensoWithdrawSpender ? [address, ensoWithdrawSpender] : undefined,
    query: { enabled: !!address && !!ensoWithdrawSpender && activeTab === 'unstake' },
  });

  // ── DOLA direct flow writes ──

  const { writeContract: approve, data: approveTxHash, isPending: isApproving, reset: resetApprove } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const { writeContract: deposit, data: depositTxHash, isPending: isDepositing, reset: resetDeposit } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({ hash: depositTxHash });

  const { writeContract: redeem, data: redeemTxHash, isPending: isRedeeming, reset: resetRedeem } = useWriteContract();
  const { isLoading: isRedeemConfirming, isSuccess: isRedeemConfirmed } = useWaitForTransactionReceipt({ hash: redeemTxHash });

  // ── Enso flow writes (two separate hooks: approval + route) ──

  const { sendTransaction: sendApprovalTx, data: ensoApprovalHash, isPending: isEnsoApprovalPending, isError: isEnsoApprovalError, reset: resetEnsoApproval } = useSendTransaction();
  const { isLoading: isEnsoApprovalConfirming, isSuccess: isEnsoApprovalConfirmed } = useWaitForTransactionReceipt({ hash: ensoApprovalHash });

  const { sendTransaction: sendRouteTx, data: ensoRouteHash, isPending: isEnsoRoutePending, isError: isEnsoRouteError, reset: resetEnsoRoute } = useSendTransaction();
  const { isLoading: isEnsoRouteConfirming, isSuccess: isEnsoRouteConfirmed } = useWaitForTransactionReceipt({ hash: ensoRouteHash });

  // ── Fetch Enso balances on wallet connect ──

  const loadBalances = useCallback(async (addr: `0x${string}`) => {
    try {
      const balances = await fetchEnsoBalances(addr);
      const balMap: Record<string, string> = {};
      const maxMap: Record<string, string> = {};
      for (const b of balances) {
        const key = b.token.toLowerCase();
        balMap[key] = formatBalance(BigInt(b.amount), b.decimals);
        maxMap[key] = formatUnits(BigInt(b.amount), b.decimals);
      }
      setTokenBalances(balMap);
      setMaxAmounts(maxMap);

      const withBalance: { token: SupportedToken; usd: number }[] = [];
      const withoutBalance: SupportedToken[] = [];
      for (const t of SUPPORTED_TOKENS) {
        const found = balances.find(b => b.token.toLowerCase() === t.address.toLowerCase());
        if (found && BigInt(found.amount) > 0n) {
          const usd = Number(found.amount) * Number(found.price) / (10 ** found.decimals);
          withBalance.push({ token: { ...t, usd, price: Number(found.price) }, usd });
        } else {
          withoutBalance.push({ ...t, price: tokenPrices[t.address.toLowerCase()] ?? t.price });
        }
      }
      withBalance.sort((a, b) => b.usd - a.usd);
      const sorted = [...withBalance.map(w => w.token), ...withoutBalance];
      setSortedTokens(sorted);
      setSelectedToken(getDefaultToken(sorted));
    } catch (err) {
      console.error('Failed to fetch Enso balances:', err);
    }
  }, []);

  useEffect(() => {
    if (address) loadBalances(address);
  }, [address, loadBalances]);

  // ── DOLA flow effects ──

  useEffect(() => {
    if (isApproveConfirmed) { refetchAllowance(); resetApprove(); }
  }, [isApproveConfirmed, refetchAllowance, resetApprove]);

  useEffect(() => {
    if (isDepositConfirmed) {
      gaEvent({ action: 'deposit', params: { category: 'staking', label: selectedToken.symbol, value: parseFloat(amount) || 0 } });
      setAmount('');
      refetchDola();
      refetchSdola();
      refetchAllowance();
      resetDeposit();
      if (address) loadBalances(address);
    }
  }, [isDepositConfirmed, refetchDola, refetchSdola, refetchAllowance, resetDeposit, address, loadBalances]);

  useEffect(() => {
    if (isRedeemConfirmed) {
      gaEvent({ action: 'withdraw', params: { category: 'staking', label: 'sDOLA', value: parseFloat(amount) || 0 } });
      setAmount('');
      setIsMaxWithdraw(false);
      refetchDola();
      refetchSdola();
      resetRedeem();
      if (address) loadBalances(address);
    }
  }, [isRedeemConfirmed, refetchDola, refetchSdola, resetRedeem, address, loadBalances]);

  // ── Recent transaction tracking ──

  useEffect(() => {
    if (approveTxHash) { addRecentTransaction({ hash: approveTxHash, description: 'Approve DOLA' }); addTxToast(approveTxHash, 'Approve DOLA'); }
  }, [approveTxHash, addRecentTransaction]);

  useEffect(() => {
    if (depositTxHash) { addRecentTransaction({ hash: depositTxHash, description: 'Deposit DOLA' }); addTxToast(depositTxHash, 'Deposit DOLA'); }
  }, [depositTxHash, addRecentTransaction]);

  useEffect(() => {
    if (redeemTxHash) { addRecentTransaction({ hash: redeemTxHash, description: 'Withdraw to DOLA' }); addTxToast(redeemTxHash, 'Withdraw to DOLA'); }
  }, [redeemTxHash, addRecentTransaction]);

  useEffect(() => {
    if (ensoApprovalHash) {
      const label = activeTab === 'stake' ? `Approve ${selectedToken.symbol}` : 'Approve sDOLA';
      addRecentTransaction({ hash: ensoApprovalHash, description: label });
      addTxToast(ensoApprovalHash, label);
    }
  }, [ensoApprovalHash, addRecentTransaction, selectedToken.symbol, activeTab]);

  useEffect(() => {
    if (ensoRouteHash) {
      const desc = activeTab === 'stake'
        ? `Deposit ${selectedToken.symbol}`
        : `Withdraw to ${withdrawDestToken.symbol}`;
      addRecentTransaction({ hash: ensoRouteHash, description: desc });
      addTxToast(ensoRouteHash, desc);
    }
  }, [ensoRouteHash, addRecentTransaction, selectedToken.symbol, withdrawDestToken.symbol, activeTab]);

  // ── Enso flow: reset on approval rejection/error ──

  useEffect(() => {
    if (ensoStep === 'approving' && isEnsoApprovalError) {
      resetEnsoApproval();
      setEnsoStep('idle');
    }
  }, [ensoStep, isEnsoApprovalError, resetEnsoApproval]);

  // ── Enso flow: auto-advance from approval → route ──

  useEffect(() => {
    if (ensoStep === 'approving' && isEnsoApprovalConfirmed) {
      const routeTx = activeTab === 'stake' ? ensoDepositRoute.tx : ensoWithdrawRoute.tx;
      if (routeTx) {
        resetEnsoApproval();
        if (activeTab === 'stake') refetchEnsoDepositAllowance();
        else refetchEnsoWithdrawAllowance();
        setEnsoStep('routing');
        sendRouteTx({
          to: routeTx.to as `0x${string}`,
          data: routeTx.data as `0x${string}`,
          value: BigInt(routeTx.value || '0'),
        });
      }
    }
  }, [ensoStep, isEnsoApprovalConfirmed, ensoDepositRoute.tx, ensoWithdrawRoute.tx, activeTab, sendRouteTx, resetEnsoApproval]);

  // ── Enso flow: reset on route rejection/error ──

  useEffect(() => {
    if (ensoStep === 'routing' && isEnsoRouteError) {
      resetEnsoRoute();
      setEnsoStep('idle');
    }
  }, [ensoStep, isEnsoRouteError, resetEnsoRoute]);

  // ── Enso flow: route confirmed ──

  useEffect(() => {
    if (ensoStep === 'routing' && isEnsoRouteConfirmed) {
      const action = activeTab === 'stake' ? 'deposit' : 'withdraw';
      const label = activeTab === 'stake' ? selectedToken.symbol : withdrawDestToken.symbol;
      gaEvent({ action, params: { category: 'staking', label, value: parseFloat(amount) || 0 } });
      setEnsoStep('idle');
      setAmount('');
      setIsMaxWithdraw(false);
      resetEnsoRoute();
      refetchSdola();
      if (activeTab === 'stake') refetchSelectedBalance();
      if (address) loadBalances(address);
    }
  }, [ensoStep, isEnsoRouteConfirmed, resetEnsoRoute, refetchSdola, refetchSelectedBalance, address, loadBalances, activeTab, selectedToken.symbol, withdrawDestToken.symbol, amount]);

  // ── Derived state ──

  const needsApproval = activeTab === 'stake' && parsedAmount > 0n && (allowance ?? 0n) < parsedAmount;

  const isDolaFlowPending = isApproving || isApproveConfirming || isDepositing || isDepositConfirming || isRedeeming || isRedeemConfirming;
  const isEnsoFlowPending = ensoStep !== 'idle' || isEnsoApprovalPending || isEnsoApprovalConfirming || isEnsoRoutePending || isEnsoRouteConfirming;
  const isPending = isDolaFlowPending || isEnsoFlowPending;

  // ── Balance display ──

  const stakeBalanceDisplay = stakeBalance !== undefined
    ? formatBalance(stakeBalance, selectedToken.decimals, 2)
    : tokenBalances[selectedToken.address.toLowerCase()] ?? '0';

  const unstakeBalanceDisplay = sdolaBalanceInDola !== undefined
    ? formatBalance(sdolaBalanceInDola, 18, 2)
    : sdolaBalance !== undefined
      ? formatBalance(sdolaBalance, 18, 2)
      : '0';

  const unstakeBalanceLabel = sdolaBalanceInDola !== undefined ? 'DOLA' : 'sDOLA';

  const balanceDisplay = activeTab === 'stake' ? stakeBalanceDisplay : unstakeBalanceDisplay;
  const balanceLabel = activeTab === 'stake' ? selectedToken.symbol : unstakeBalanceLabel;

  const inputUsd = (() => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) return 0;
    if (activeTab === 'stake') {
      const price = (selectedToken.price || 0);
      return qty * price;
    }
    return qty * (stakingData?.dolaPriceUsd || 1);
  })();

  // ── Handlers ──

  function handleMax() {
    if (activeTab === 'unstake') {
      if (sdolaBalance && sdolaBalance > 0n) {
        setIsMaxWithdraw(true);
        const displayDola = sdolaBalanceInDola ?? sdolaBalance;
        setAmount(formatUnits(displayDola, 18));
      }
      return;
    }
    if (stakeBalance) {
      setAmount(formatUnits(stakeBalance, selectedToken.decimals));
    }
  }

  function handleApprove() {
    gaEvent({ action: 'approve', params: { category: 'staking', label: 'DOLA', value: 0 } });
    approve({
      address: DOLA_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SDOLA_ADDRESS, maxUint256],
    });
  }

  function handleDeposit() {
    if (!address) return;
    deposit({
      address: SDOLA_ADDRESS,
      abi: ERC4626_ABI,
      functionName: 'deposit',
      args: [parsedAmount, address],
    });
  }

  function handleRedeem() {
    if (!address) return;
    if (isMaxWithdraw) {
      // Burn full sDOLA balance to avoid dust
      redeem({
        address: SDOLA_ADDRESS,
        abi: ERC4626_ABI,
        functionName: 'redeem',
        args: [sdolaWithdrawBN, address, address],
      });
    } else {
      // Exact DOLA amount out
      redeem({
        address: SDOLA_ADDRESS,
        abi: ERC4626_ABI,
        functionName: 'withdraw',
        args: [parsedAmount, address, address],
      });
    }
  }

  async function handleEnsoDeposit() {
    if (!address || !ensoDepositRoute.tx) return;

    // Native ETH: no approval needed
    if (isNativeEth(selectedToken.address)) {
      setEnsoStep('routing');
      sendRouteTx({
        to: ensoDepositRoute.tx.to as `0x${string}`,
        data: ensoDepositRoute.tx.data as `0x${string}`,
        value: BigInt(ensoDepositRoute.tx.value || '0'),
      });
      return;
    }

    // ERC20: check if approval is needed
    const needsApprovalDeposit = ensoDepositAllowance === undefined || ensoDepositAllowance < BigInt(amountInWei);
    if (needsApprovalDeposit) {
      try {
        const isUsdt = selectedToken.address.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7';
        const approval = await fetchEnsoApproval({
          fromAddress: address,
          tokenAddress: selectedToken.address,
          amount: isUsdt ? maxUint256.toString() : amountInWei,
        });

        if (approval.tx?.data && approval.tx.data !== '0x') {
          setEnsoStep('approving');
          sendApprovalTx({
            to: approval.tx.to as `0x${string}`,
            data: approval.tx.data as `0x${string}`,
            value: BigInt(approval.tx.value || '0'),
          });
          return;
        }
      } catch (err) {
        console.error('Approval check failed:', err);
      }
    }

    // Already approved — send route directly
    setEnsoStep('routing');
    sendRouteTx({
      to: ensoDepositRoute.tx.to as `0x${string}`,
      data: ensoDepositRoute.tx.data as `0x${string}`,
      value: BigInt(ensoDepositRoute.tx.value || '0'),
    });
  }

  async function handleEnsoWithdraw() {
    if (!address || !ensoWithdrawRoute.tx) return;

    const needsApprovalWithdraw = ensoWithdrawAllowance === undefined || ensoWithdrawAllowance < BigInt(sdolaWithdrawAmountWei);
    if (needsApprovalWithdraw) {
      try {
        const approval = await fetchEnsoApproval({
          fromAddress: address,
          tokenAddress: SDOLA_ADDRESS,
          amount: sdolaWithdrawAmountWei,
        });

        if (approval.tx?.data && approval.tx.data !== '0x') {
          setEnsoStep('approving');
          sendApprovalTx({
            to: approval.tx.to as `0x${string}`,
            data: approval.tx.data as `0x${string}`,
            value: BigInt(approval.tx.value || '0'),
          });
          return;
        }
      } catch (err) {
        console.error('Withdrawal approval check failed:', err);
      }
    }

    setEnsoStep('routing');
    sendRouteTx({
      to: ensoWithdrawRoute.tx.to as `0x${string}`,
      data: ensoWithdrawRoute.tx.data as `0x${string}`,
      value: BigInt(ensoWithdrawRoute.tx.value || '0'),
    });
  }

  // ── TOS gate ──

  function withTosCheck(fn: () => void): () => void {
    return () => {
      if (typeof window !== 'undefined' && localStorage.getItem(TOS_STORAGE_KEY) === 'true') {
        fn();
      } else {
        pendingActionRef.current = fn;
        setShowTosModal(true);
      }
    };
  }

  function handleTosAccept() {
    if (typeof window !== 'undefined') localStorage.setItem(TOS_STORAGE_KEY, 'true');
    setShowTosModal(false);
    pendingActionRef.current?.();
    pendingActionRef.current = null;
  }

  // ── Button config ──

  function getButtonConfig(): { text: string; onClick: () => void; disabled: boolean } {
    if(process.env.NEXT_PUBLIC_DISABLE_SWAPS === 'true') return { text: 'Swaps are temporarily disabled', onClick: () => { }, disabled: true };
    if (!isConnected) return { text: t.connectWallet, onClick: () => { gaEvent({ action: 'connect_wallet_click', params: { category: 'wallet', label: 'staking_card', value: 0 } }); openConnectModal?.(); }, disabled: false };
    if (!amount || parsedAmount === 0n) return { text: t.enterAmount, onClick: () => { }, disabled: true };
    if (insufficientBalance) return { text: t.insufficientBalance, onClick: () => { }, disabled: true };

    if (activeTab === 'stake') {
      if (usingEnsoDeposit) {
        if (ensoDepositRoute.isLoading) return { text: t.fetchingRoute, onClick: () => { }, disabled: true };
        if (ensoDepositRoute.error) return { text: t.routeError, onClick: () => { }, disabled: true };
        if (!ensoDepositRoute.tx) return { text: t.enterAmount, onClick: () => { }, disabled: true };
        if (ensoStep === 'approving' || isEnsoApprovalPending || isEnsoApprovalConfirming)
          return { text: t.approving, onClick: () => { }, disabled: true };
        if (ensoStep === 'routing' || isEnsoRoutePending || isEnsoRouteConfirming)
          return { text: t.depositing, onClick: () => { }, disabled: true };
        return { text: `Swap ${selectedToken.symbol} to ${stakingData?.zapSymbol || stakingData?.symbol}`, onClick: withTosCheck(handleEnsoDeposit), disabled: blockHighWorthDiff };
      } else {
        if (isApproving || isApproveConfirming) return { text: t.approving, onClick: () => { }, disabled: true };
        if (needsApproval) return { text: t.approveDola, onClick: withTosCheck(handleApprove), disabled: false };
        if (isDepositing || isDepositConfirming) return { text: t.depositing, onClick: () => { }, disabled: true };
        return { text: t.depositDola, onClick: withTosCheck(handleDeposit), disabled: false };
      }
    }

    // Unstake tab
    if (usingEnsoWithdraw) {
      const waitingForShares = !isMaxWithdraw && sdolaWithdrawBN === 0n;
      if (ensoWithdrawRoute.isLoading || waitingForShares) return { text: t.fetchingRoute, onClick: () => { }, disabled: true };
      if (ensoWithdrawRoute.error) return { text: t.routeError, onClick: () => { }, disabled: true };
      if (!ensoWithdrawRoute.tx) return { text: t.enterAmount, onClick: () => { }, disabled: true };
      if (ensoStep === 'approving' || isEnsoApprovalPending || isEnsoApprovalConfirming)
        return { text: t.approving, onClick: () => { }, disabled: true };
      if (ensoStep === 'routing' || isEnsoRoutePending || isEnsoRouteConfirming)
        return { text: t.withdrawing, onClick: () => { }, disabled: true };
      return { text: t.withdrawToToken.replace('{symbol}', withdrawDestToken.symbol), onClick: withTosCheck(handleEnsoWithdraw), disabled: false };
    }

    if (isRedeeming || isRedeemConfirming) return { text: t.withdrawing, onClick: () => { }, disabled: true };
    return { text: t.withdrawToDola, onClick: withTosCheck(handleRedeem), disabled: false };
  }

  const depositUsd = selectedToken ? (parseFloat(amount) || 0) * selectedToken.price : 0;
  const estimatedOutput = ensoDepositRoute.isLoading ? '' : ensoDepositRoute.amountOut;
  const outputDecimals = stakingData ? stakingData?.zapDecimals || stakingData?.decimals : 18;
  const estimatedOutputFormatted = estimatedOutput ? formatTokenAmount(estimatedOutput, outputDecimals, 2) : '';
  const outputFloat = estimatedOutput ? parseFloat(formatUnits(estimatedOutput, outputDecimals)) : 0;
  const outputUsd = outputFloat ? outputFloat * stakingData.vaultPrice : 0;

  const worthDiff = depositUsd && outputUsd ? (depositUsd - outputUsd) / depositUsd : 0;
  const warnHighWorthDiff = worthDiff > 0.01;
  const blockHighWorthDiff = worthDiff > 0.05;

  const btn = getButtonConfig();

  return (
    <>
      {showTosModal && <TermsModal onAccept={handleTosAccept} onClose={() => setShowTosModal(false)} />}
      <div className="card-shine relative bg-container border border-white/[0.05] rounded-2xl backdrop-blur-sm">

        {/* Tabs */}
        <div className="relative flex border-b border-white/[0.05]">
          {(['stake'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                gaEvent({ action: 'tab_switch', params: { category: 'staking', label: tab, value: 0 } });
                setActiveTab(tab);
                setAmount('');
                setSelectedToken(getDefaultToken(sortedTokens));
                setEnsoStep('idle');
                setIsMaxWithdraw(false);
                setShowSlippage(false);
              }}
              className={`cursor-pointer flex-1 py-3.5 text-sm font-medium tracking-wide transition-all duration-200 relative ${activeTab === tab
                ? 'text-foreground'
                : 'text-text-muted hover:text-text-secondary'
                }`}
            >
              <span className="inline-block">
                <span className="flex flex-row gap-1">
                  <p className="text text-sm">{tab === 'stake' ? 'Earn with ' : t.tabWithdraw}</p>
                  <p className="font-bold">{stakingData.symbol}</p>
                  <Image className="" src={stakingData.image} width={20} height={20} alt={stakingData.symbol} />
                </span>
              </span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
              )}
            </button>
          ))}

          {/* Slippage settings */}
          <div className="absolute top-0 right-0 bottom-0 flex items-center justify-end px-4">
            <SlippageSelector value={slippageSetting} onChange={setSlippageSetting} label={t.slippageTolerance} />
          </div>
        </div>

        <div className="px-5 pt-5 sm:px-6">
          <div style={{ display: (activeTab === 'stake' ? 'block' : 'none') }}>
            <SavingsOpportunites
              apy={stakingData.apy}
              totalAssets={stakingData.totalAssets}
              tokens={sortedTokens}
              onSelectToken={(t) => {
                gaEvent({ action: 'select_idle_stable', params: { category: 'opportunities', label: t.symbol, value: Math.round(t.usd || 0) } });
                setSelectedToken(t);
                setAmount(maxAmounts[t.address.toLowerCase()] ?? '');
              }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
          {/* Input container */}
          <div className="bg-surface/50 border border-white/[0.04] rounded-xl p-4">
            {/* Label + balance row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">
                {activeTab === 'stake' ? t.youDeposit : t.youWithdraw}
              </span>
              {isConnected && (
                <button
                  onClick={handleMax}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors duration-150 cursor-pointer group"
                >
                  <span className="text-muted-foreground">{t.bal} </span>
                  <span className="text-muted-foreground font-mono">{balanceDisplay}</span>
                  <span className="text-accent font-semibold ml-1 group-hover:text-accent-hover transition-colors">{t.max}</span>
                </button>
              )}
            </div>

            {/* Amount + token selector row */}
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder={'0.00'}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setIsMaxWithdraw(false); }}
                disabled={ensoStep !== 'idle' || (activeTab === 'unstake' && balanceDisplay === '0')}
                className="flex-1 min-w-0 bg-transparent text-2xl font-mono text-foreground placeholder:text-white/[0.15] focus:outline-none disabled:opacity-40 transition-opacity"
              />
              {activeTab === 'stake' ? (
                <TokenSelector
                  tokens={sortedTokens}
                  selected={selectedToken}
                  onSelect={(t) => { gaEvent({ action: 'select_token', params: { category: 'staking', label: t.symbol, value: 0 } }); setSelectedToken(t); if (!t.isIdleStable || !selectedToken.isIdleStable) setAmount(''); }}
                  balances={tokenBalances}
                />
              ) : (
                <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.06] rounded-xl px-3 py-2 shrink-0">
                  <Image src={DOLA_TOKEN.logoUri} alt={DOLA_TOKEN.symbol} width={20} height={20} className="rounded-full" />
                  <span className="text-sm font-semibold text-text-muted">DOLA</span>
                </div>
              )}
            </div>

            {/* USD worth of input */}
            {inputUsd > 0 && (
              <div className="mt-1.5 text-text-muted text-xs font-mono">
                ≈{formatUsd(inputUsd)}
              </div>
            )}

            {/* Withdraw destination — inside the input zone */}
            {activeTab === 'unstake' && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">{t.toLabel}</span>
                <TokenSelector
                  tokens={sortedTokens}
                  selected={withdrawDestToken}
                  onSelect={(t) => {
                    gaEvent({ action: 'select_withdraw_dest', params: { category: 'staking', label: t.symbol, value: 0 } });
                    setWithdrawDestToken(t);
                  }}
                  balances={tokenBalances}
                />
              </div>
            )}
          </div>

          {/* Preview — Deposit */}
          {parsedAmount > 0n && activeTab === 'stake' && (
            <div className="border border-white/[0.04] rounded-xl px-4 py-3">
              {selectedToken.price ? (
                <SelectedOpportunity
                  token={stakingData}
                  apy={stakingData.apy}
                  totalAssets={stakingData.totalAssets}
                  priceUsd={selectedToken.price}
                  depositUsd={depositUsd}
                  estimatedOutputFormatted={estimatedOutputFormatted}
                  outputUsd={outputUsd}
                  isConnected={isConnected}
                />
              )
                :
                ensoDepositRoute.isLoading ? (
                  <div className="flex justify-center py-0.5">
                    <span className="inline-block w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  </div>
                ) : ensoDepositRoute.amountOut ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t.estimatedOutput}</span>
                    <span className="font-mono text-foreground">≈{estimatedOutputFormatted} {stakingData?.zapSymbol || stakingData?.symbol}</span>
                  </div>
                ) : ensoDepositRoute.error ? (
                  <div className="text-sm text-red-400 text-center">{ensoDepositRoute.error}</div>
                ) : null}
            </div>
          )}

          {/* Preview — Withdraw */}
          {activeTab === 'unstake' && sdolaWithdrawBN > 0n && !isDola(withdrawDestToken.address) && (
            <div className="border border-white/[0.04] rounded-xl px-4 py-3">
              {usingEnsoWithdraw ? (
                ensoWithdrawRoute.isLoading ? (
                  <div className="flex justify-center py-0.5">
                    <span className="inline-block w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                  </div>
                ) : ensoWithdrawRoute.amountOut ? (
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-text-muted">{t.estimatedOutput}</span>
                    <div className="text-right">
                      <div className="font-mono text-foreground">
                        ≈{formatTokenAmount(ensoWithdrawRoute.amountOut, withdrawDestToken.decimals)} {withdrawDestToken.symbol}
                      </div>
                      {withdrawDestToken.price ? (
                        <div className="text-text-muted text-xs">
                          ≈${(Number(formatUnits(BigInt(ensoWithdrawRoute.amountOut), withdrawDestToken.decimals)) * withdrawDestToken.price).toFixed(2)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : ensoWithdrawRoute.error ? (
                  <div className="text-sm text-red-400 text-center">{ensoWithdrawRoute.error}</div>
                ) : null
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t.youWillReceive}</span>
                  <span className="font-mono text-foreground">
                    {isMaxWithdraw ? `≈${formatBalance(sdolaBalanceInDola ?? parsedAmount, 18, 2)}` : formatBalance(parsedAmount, 18, 2)} DOLA
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Worth diff warnings */}
          {
            !ensoDepositRoute.isLoading && !ensoDepositRoute.error && <WorthDiffWarning warnHighWorthDiff={warnHighWorthDiff} blockHighWorthDiff={blockHighWorthDiff} />
          }

          {/* Action Button */}
          <button
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={`w-full py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${btn.disabled
              ? 'bg-white/[0.04] text-text-muted cursor-not-allowed border border-white/[0.04]'
              : 'btn-primary text-[#1A0E00] cursor-pointer'
              }`}
          >
            {isPending && !btn.disabled && (
              <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin mr-2 align-middle" />
            )}
            {btn.text}
          </button>
          <p className="text-text-muted text-center w-full text-xs">
            Routing is powered by Enso & inclusive of a {smartShortNumber(FEE_BPS/100, 2)}% frontend fee
          </p>
        </div>
      </div>
    </>
  );
}
