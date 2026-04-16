'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { SUPPORTED_TOKENS, type SupportedToken } from '@/lib/tokens';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { type StakingData } from '@/app/types';
import { type VaultPosition } from './UserPositions';
import { useEnsoRoute } from '@/hooks/useEnsoRoute';
import { fetchEnsoApproval, fetchEnsoBalances } from '@/lib/enso';
import { ERC20_ABI } from '@/lib/contracts';
import { TokenSelector, type TokenMeta } from './TokenSelector';
import { formatUsd, formatTokenAmount, smartShortNumber } from '@/lib/utils';
import { addTxToast } from '@/lib/toastStore';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { SelectedOpportunity } from './SavingsOpportunities';
import { WorthDiffWarning } from './WorthDiffWarning';
import { SlippageSelector, type SlippageSetting } from './SlippageSelector';

type EnsoStep = 'idle' | 'approving' | 'routing';

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;

function positionToToken(pos: VaultPosition): SupportedToken {
  return {
    address: pos.tokenAddress,
    symbol: pos.stakingData.zapSymbol || pos.stakingData.symbol,
    name: `${pos.stakingData.project}`,
    decimals: pos.decimals,
    logoUri: pos.stakingData.image,
    usd: pos.usdValue,
    isVault: true,
    coingeckoId: '',
  };
}

function buildDestTokens(
  yieldData: StakingData[],
  tokenPrices: TokenPrices,
): { tokens: StakingData[]; metaMap: Record<string, TokenMeta> } {
  const metaMap: Record<string, TokenMeta> = {};
  const yieldTokens: StakingData[] = [];
  const yieldAddresses = new Set<string>();

  for (const item of yieldData) {
    const addr = (item.zapAddress || item.address) as string | undefined;
    if (!addr) continue;
    const lower = addr.toLowerCase();
    if (yieldAddresses.has(lower)) continue;
    yieldAddresses.add(lower);
    metaMap[lower] = { apy: item.apy, tvl: item.tvl };
    yieldTokens.push({
      address: addr as `0x${string}`,
      symbol: item.zapSymbol || item.symbol,
      name: `${item.project}`,
      decimals: item.zapDecimals || item.decimals,
      logoUri: item.image,
      usd: 0,
      coingeckoId: '',
      totalAssets: item.totalAssets,
      vaultPrice: item.vaultPrice,
      apy: item.apy,
      isVault: item.isVault,
    });
  }

  const plainTokens = SUPPORTED_TOKENS
    .filter(t => !yieldAddresses.has(t.address.toLowerCase()))
    .map(t => ({ ...t, price: tokenPrices[t.address.toLowerCase()] ?? t.price }));

  return { tokens: [...yieldTokens, ...plainTokens], metaMap };
}

export function ManagePositionModal({
  position,
  allPositions,
  yieldData,
  tokenPrices,
  address,
  onDismiss,
  onSuccess,
}: {
  position: VaultPosition;
  allPositions: VaultPosition[];
  yieldData: StakingData[];
  tokenPrices: TokenPrices;
  address: `0x${string}`;
  onDismiss: () => void;
  onSuccess: () => void;
}) {
  const [sourceToken, setSourceToken] = useState<SupportedToken>(() => positionToToken(position));
  const [amount, setAmount] = useState('');
  const [ensoStep, setEnsoStep] = useState<EnsoStep>('idle');
  const [slippageSetting, setSlippageSetting] = useState<SlippageSetting>('auto');
  const [walletBalances, setWalletBalances] = useState<Record<string, { amountWei: bigint; decimals: number; formatted: string }>>({});

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    fetchEnsoBalances(address)
      .then(balances => {
        if (cancelled) return;
        const map: Record<string, { amountWei: bigint; decimals: number; formatted: string }> = {};
        for (const b of balances) {
          const amt = BigInt(b.amount);
          map[b.token.toLowerCase()] = {
            amountWei: amt,
            decimals: b.decimals,
            formatted: formatUnits(amt, b.decimals),
          };
        }
        setWalletBalances(map);
      })
      .catch(err => console.error('Failed to fetch wallet balances:', err));
    return () => { cancelled = true; };
  }, [address]);

  const currentSourcePos = allPositions.find(
    p => p.tokenAddress.toLowerCase() === sourceToken.address.toLowerCase()
  );
  const sourceIsVault = !!currentSourcePos;

  const { tokens: allDestTokens, metaMap: destMeta } = buildDestTokens(yieldData, tokenPrices);
  const destTokens = allDestTokens.filter(t => t.address.toLowerCase() !== sourceToken.address.toLowerCase());
  const [destToken, setDestToken] = useState<SupportedToken>(() => {
    return destTokens.find(t => t.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) ?? destTokens[0];
  });

  const baseSourceTokens = allPositions.map(positionToToken);
  const baseSourceAddrs = new Set(baseSourceTokens.map(t => t.address.toLowerCase()));
  const destIsVault = !!(destToken as { isVault?: boolean }).isVault;

  const enrichWalletToken = (t: SupportedToken): SupportedToken => {
    const key = t.address.toLowerCase();
    const price = tokenPrices[key] ?? t.price ?? 0;
    const wb = walletBalances[key];
    const usd = wb && price ? Number(wb.formatted) * price : (t.usd || 0);
    return { ...t, price, usd };
  };

  const extraWalletSources: SupportedToken[] = destIsVault
    ? SUPPORTED_TOKENS
      .filter(t => t.isIdleStable || !t.isStablish)
      .filter(t => !baseSourceAddrs.has(t.address.toLowerCase()))
      .filter(t => t.address.toLowerCase() !== destToken.address.toLowerCase())
      .map(enrichWalletToken)
    : [];

  const sourceTokens = sourceIsVault
    ? [...baseSourceTokens, ...extraWalletSources]
    : [
      enrichWalletToken(sourceToken),
      ...baseSourceTokens,
      ...extraWalletSources.filter(t => t.address.toLowerCase() !== sourceToken.address.toLowerCase()),
    ];

  const sourceMeta: Record<string, TokenMeta> = Object.fromEntries(
    allPositions.map(p => [p.tokenAddress.toLowerCase(), { apy: p.stakingData.apy, tvl: p.stakingData.tvl }])
  );
  const sourceBals: Record<string, string> = Object.fromEntries(
    allPositions.map(p => [p.tokenAddress.toLowerCase(), p.balance < 0.0001 ? '<0.0001' : p.balance.toFixed(4)])
  );
  for (const t of extraWalletSources) {
    const wb = walletBalances[t.address.toLowerCase()];
    if (wb) {
      const n = Number(wb.formatted);
      sourceBals[t.address.toLowerCase()] = n < 0.0001 ? '<0.0001' : n.toFixed(4);
    }
  }
  if (!sourceIsVault) {
    const wb = walletBalances[sourceToken.address.toLowerCase()];
    if (wb) {
      const n = Number(wb.formatted);
      sourceBals[sourceToken.address.toLowerCase()] = n < 0.0001 ? '<0.0001' : n.toFixed(4);
    }
  }

  function handleFlipTokens() {
    if (isPending) return;

    const nextSource =
      allDestTokens.find(t => t.address.toLowerCase() === destToken.address.toLowerCase()) ??
      destToken;

    const nextDest =
      allDestTokens.find(t => t.address.toLowerCase() === sourceToken.address.toLowerCase()) ??
      (allDestTokens.find(t => t.address.toLowerCase() !== nextSource.address.toLowerCase()) as SupportedToken | undefined);

    setSourceToken(nextSource);
    if (nextDest) setDestToken(nextDest);
    setAmount('');
  }

  const walletBal = walletBalances[sourceToken.address.toLowerCase()];
  const sourceBalanceWei = sourceIsVault ? currentSourcePos!.amountWei : walletBal?.amountWei ?? 0n;
  const sourceDecimals = sourceIsVault ? currentSourcePos!.decimals : sourceToken.decimals;
  const sourceBalanceNum = sourceIsVault
    ? currentSourcePos!.balance
    : walletBal ? Number(walletBal.formatted) : 0;
  const maxAmount = formatUnits(sourceBalanceWei, sourceDecimals);

  const amountWei = (() => {
    if (!amount) return '0';
    try { return parseUnits(amount, sourceDecimals).toString(); } catch { return '0'; }
  })();

  const isDestStablish = destToken.isStablish || destToken.isVault;
  const isSourceStablish = sourceToken.isStablish || sourceToken.isVault;
  const isOneOfTwoStablish = ((isSourceStablish && !isDestStablish) || (!isSourceStablish && isDestStablish));

  const insufficientBalance = (() => {
    if (amountWei === '0') return false;
    try { return BigInt(amountWei) > sourceBalanceWei; } catch { return false; }
  })();

  const resolvedSlippage = slippageSetting === 'auto'
  // auto: if both stablish => 3bps, if only one => 30 bps, otherwise 60bps
    ? (isDestStablish && isSourceStablish ? '3' : isOneOfTwoStablish ? '30' : '60')
    : slippageSetting;

  const canAutoRefresh = ensoStep === 'idle' && !!amount && amountWei !== '0' && !insufficientBalance;
  const route = useEnsoRoute(sourceToken.address, amountWei, address, resolvedSlippage, destToken.address, canAutoRefresh);

  const spender = route.tx?.to as `0x${string}` | undefined;
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: sourceToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: spender ? [address, spender] : undefined,
    query: { enabled: !!spender },
  });

  const outputFormatted = route.amountOut ? formatTokenAmount(route.amountOut, destToken.decimals, (destToken.price || 0) > 10 ? 4 : 2) : '';
  
  const outputUsd = route.amountOut
    ? Number(formatUnits(BigInt(route.amountOut), destToken.decimals)) * (((destToken.vaultPrice || tokenPrices[destToken.address.toLowerCase()]) ?? 0))
    : 0;

  const inputUsd = (() => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) return 0;
    if (sourceIsVault && currentSourcePos!.usdValue > 0 && currentSourcePos!.balance > 0) {
      return (qty / currentSourcePos!.balance) * currentSourcePos!.usdValue;
    }
    const price = tokenPrices[sourceToken.address.toLowerCase()] ?? sourceToken.price ?? 0;
    return qty * price;
  })();

  const addRecentTransaction = useAddRecentTransaction();

  const { sendTransaction: sendApprovalTx, data: approvalHash, isPending: isApprovalPending, isError: isApprovalError, reset: resetApproval } = useSendTransaction();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: approvalHash });

  const { sendTransaction: sendRouteTx, data: routeHash, isPending: isRoutePending, isError: isRouteError, reset: resetRoute } = useSendTransaction();
  const { isLoading: isRouteConfirming, isSuccess: isRouteConfirmed } = useWaitForTransactionReceipt({ hash: routeHash });

  useEffect(() => {
    if (approvalHash) {
      addRecentTransaction({ hash: approvalHash, description: `Approve ${sourceToken.symbol}` });
      addTxToast(approvalHash, `Approve ${sourceToken.symbol}`);
    }
  }, [approvalHash]);

  useEffect(() => {
    if (routeHash) {
      addRecentTransaction({ hash: routeHash, description: `Swap ${sourceToken.symbol} → ${destToken.symbol}` });
      addTxToast(routeHash, `Swap ${sourceToken.symbol} → ${destToken.symbol}`);
    }
  }, [routeHash]);

  useEffect(() => {
    if (ensoStep === 'approving' && isApprovalError) { resetApproval(); setEnsoStep('idle'); }
  }, [ensoStep, isApprovalError]);

  useEffect(() => {
    if (ensoStep === 'approving' && isApprovalConfirmed && route.tx) {
      resetApproval();
      refetchAllowance();
      setEnsoStep('routing');
      sendRouteTx({ to: route.tx.to as `0x${string}`, data: route.tx.data as `0x${string}`, value: BigInt(route.tx.value || '0') });
    }
  }, [ensoStep, isApprovalConfirmed, route.tx]);

  useEffect(() => {
    if (ensoStep === 'routing' && isRouteError) { resetRoute(); setEnsoStep('idle'); }
  }, [ensoStep, isRouteError]);

  useEffect(() => {
    if (ensoStep === 'routing' && isRouteConfirmed) {
      setEnsoStep('idle'); setAmount(''); resetRoute(); onSuccess();
    }
  }, [ensoStep, isRouteConfirmed]);

  const isPending = ensoStep !== 'idle' || isApprovalPending || isApprovalConfirming || isRoutePending || isRouteConfirming;

  async function handleSwap() {
    if (!route.tx || !amount) return;
    const needsApproval = currentAllowance === undefined || currentAllowance < BigInt(amountWei);
    if (needsApproval) {
      try {
        const approval = await fetchEnsoApproval({ fromAddress: address, tokenAddress: sourceToken.address, amount: amountWei });
        if (approval.tx?.data && approval.tx.data !== '0x') {
          setEnsoStep('approving');
          sendApprovalTx({ to: approval.tx.to as `0x${string}`, data: approval.tx.data as `0x${string}`, value: BigInt(approval.tx.value || '0') });
          return;
        }
      } catch (err) { console.error('Approval check failed:', err); }
    }
    setEnsoStep('routing');
    sendRouteTx({ to: route.tx.to as `0x${string}`, data: route.tx.data as `0x${string}`, value: BigInt(route.tx.value || '0') });
  }

  const worthDiff = inputUsd && outputUsd ? (inputUsd - outputUsd) / inputUsd : 0;
  const warnHighWorthDiff = worthDiff > 0.01;
  const blockHighWorthDiff = worthDiff > 0.05;

  const btnDisabled = isPending || !amount || amountWei === '0' || !route.tx || route.isLoading || blockHighWorthDiff || insufficientBalance;
  const btnText =
    ensoStep === 'approving' ? 'Approving…' :
      ensoStep === 'routing' ? 'Swapping…' :
        insufficientBalance ? 'Insufficient balance' :
          route.isLoading ? 'Fetching route…' :
            `Swap to ${destToken.symbol}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onDismiss}
    >
      <div
        className="bg-container w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <h3 className="text-base font-semibold text-foreground">Manage Positions</h3>
          <div className="flex items-center gap-3">
            <SlippageSelector value={slippageSetting} onChange={setSlippageSetting} label="Slippage tolerance" />
            <button onClick={onDismiss} className="cursor-pointer text-text-muted hover:text-foreground transition text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
          {/* Main input container — mirrors StakingCard deposit box */}
          <div className="bg-surface/50 border border-white/[0.04] rounded-xl p-4">

            {/* YOU SWAP row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">
                {sourceIsVault ? 'Withdraw From' : `Swap ${sourceToken.symbol}`}
              </span>
              <button
                onClick={() => setAmount(maxAmount)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer group"
              >
                <span className="text-muted-foreground">Bal {sourceBalanceNum < 0.0001 ? (sourceBalanceNum > 0 ? '<0.0001' : '0') : sourceBalanceNum.toFixed(4)}</span>
                <span className="text-accent text-mono font-semibold ml-1 group-hover:text-accent-hover transition-colors">MAX</span>
              </button>
            </div>

            {/* Amount + source selector */}
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isPending}
                className="flex-1 min-w-0 bg-transparent text-2xl font-mono text-foreground placeholder:text-white/[0.15] focus:outline-none disabled:opacity-40 transition-opacity"
              />
              <TokenSelector
                tokens={sourceTokens}
                selected={sourceToken}
                onSelect={t => {
                  setSourceToken(t);
                  setAmount('');
                  // If current dest is the new source, reset dest to USDC (or first available)
                  if (destToken.address.toLowerCase() === t.address.toLowerCase()) {
                    const next = allDestTokens.find(d => d.address.toLowerCase() !== t.address.toLowerCase() && d.address.toLowerCase() === USDC_ADDRESS.toLowerCase())
                      ?? allDestTokens.find(d => d.address.toLowerCase() !== t.address.toLowerCase());
                    if (next) setDestToken(next);
                  }
                }}
                balances={sourceBals}
                metadata={sourceMeta}
                type={'vaultExit'}
              />
            </div>

            {inputUsd > 0 && (
              <div className="mt-1.5 text-text-muted text-xs font-mono">≈{formatUsd(inputUsd)}</div>
            )}

            {/* Flip button — round, centered on the separator */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.04]" />
              <button
                type="button"
                onClick={handleFlipTokens}
                disabled={isPending}
                title="Swap source and destination"
                aria-label="Swap source and destination"
                className={`group relative p-2 z-10 w-9 h-9 rounded-full border flex items-center justify-center bg-container transition-all duration-200 ${isPending
                  ? 'border-white/[0.06] text-text-muted cursor-not-allowed'
                  : 'border-white/[0.10] text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/[0.08] hover:scale-110 hover:shadow-[0_0_12px_rgba(255,165,0,0.15)] cursor-pointer'
                  }`}
              >
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            {/* TO row — destination */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">To</span>
                <TokenSelector
                  tokens={destTokens}
                  selected={destToken}
                  onSelect={setDestToken}
                  metadata={destMeta}
                />
              </div>
              {/* Output preview */}
              {amountWei !== '0' && (
                <div className="">
                  {route.isLoading ? (
                    <div className="flex justify-center py-0.5">
                      <span className="inline-block w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : route.error ? (
                    <div className="text-sm text-red-400 text-center">{route.error}</div>
                  ) : outputFormatted ? <SelectedOpportunity
                    token={destToken}
                    apy={destToken.apy}
                    totalAssets={destToken.totalAssets}
                    priceUsd={destToken.vaultPrice}
                    depositUsd={inputUsd}
                    outputUsd={outputUsd}
                    estimatedOutputFormatted={outputFormatted}
                    isConnected={true}
                  /> : null}
                </div>
              )}
            </div>
          </div>

          {
            !route?.isLoading && !route?.error && <WorthDiffWarning warnHighWorthDiff={warnHighWorthDiff} blockHighWorthDiff={blockHighWorthDiff} />
          }

          {/* Action button */}
          <button
            onClick={handleSwap}
            disabled={btnDisabled}
            className={`w-full py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${btnDisabled
              ? 'bg-white/[0.04] text-text-muted cursor-not-allowed border border-white/[0.04]'
              : 'btn-primary text-[#1A0E00] cursor-pointer'
              }`}
          >
            {isPending && (
              <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin mr-2 align-middle" />
            )}
            {btnText}
          </button>
          <p className="text-text-muted text-center w-full text-xs">
            Routing is powered by Enso & inclusive of a 0.1% frontend fee
          </p>
        </div>
      </div>
    </div>
  );
}
