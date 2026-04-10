'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import Image from 'next/image';
import { SUPPORTED_TOKENS, type SupportedToken } from '@/lib/tokens';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { type StakingData } from '@/app/types';
import { type VaultPosition } from './UserPositions';
import { useEnsoRoute } from '@/hooks/useEnsoRoute';
import { fetchEnsoApproval } from '@/lib/enso';
import { TokenSelector } from './TokenSelector';
import { formatUsd, formatTokenAmount } from '@/lib/utils';
import { addTxToast } from '@/lib/toastStore';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';

type EnsoStep = 'idle' | 'approving' | 'routing';

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;

function positionToToken(pos: VaultPosition): SupportedToken {
  return {
    address: pos.tokenAddress,
    symbol: pos.stakingData.zapSymbol || pos.stakingData.symbol,
    name: `${pos.stakingData.symbol} · ${pos.stakingData.project}`,
    decimals: pos.decimals,
    logoUri: pos.stakingData.image,
    usd: pos.usdValue,
    coingeckoId: '',
  };
}

function buildDestTokens(
  yieldData: StakingData[],
  tokenPrices: TokenPrices,
): { tokens: SupportedToken[]; apyMap: Record<string, number> } {
  const apyMap: Record<string, number> = {};

  // Yield tokens from data (vaults)
  const yieldTokens: SupportedToken[] = [];
  const yieldAddresses = new Set<string>();
  for (const item of yieldData) {
    const addr = (item.zapAddress || item.address) as string | undefined;
    if (!addr) continue;
    const lower = addr.toLowerCase();
    if (yieldAddresses.has(lower)) continue;
    yieldAddresses.add(lower);
    apyMap[lower] = item.apy;
    yieldTokens.push({
      address: addr as `0x${string}`,
      symbol: item.zapSymbol || item.symbol,
      name: `${item.symbol} · ${item.project}`,
      decimals: item.zapDecimals || item.decimals,
      logoUri: item.image,
      usd: 0,
      coingeckoId: '',
    });
  }

  // Plain tokens: SUPPORTED_TOKENS not already in yield set
  const plainTokens = SUPPORTED_TOKENS
    .filter(t => !yieldAddresses.has(t.address.toLowerCase()))
    .map(t => ({ ...t, price: tokenPrices[t.address.toLowerCase()] ?? t.price }));

  return { tokens: [...yieldTokens, ...plainTokens], apyMap };
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
  const sourceTokens = allPositions.map(positionToToken);
  const [sourceToken, setSourceToken] = useState<SupportedToken>(() => positionToToken(position));
  const [amount, setAmount] = useState('');
  const [ensoStep, setEnsoStep] = useState<EnsoStep>('idle');

  const { tokens: destTokens, apyMap } = buildDestTokens(yieldData, tokenPrices);
  const [destToken, setDestToken] = useState<SupportedToken>(() => {
    return destTokens.find(t => t.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) ?? destTokens[0];
  });

  // Keep source in sync with position changes (if position changes externally)
  const currentSourcePos = allPositions.find(
    p => p.tokenAddress.toLowerCase() === sourceToken.address.toLowerCase()
  ) ?? position;

  const maxAmount = formatUnits(currentSourcePos.amountWei, currentSourcePos.decimals);

  const amountWei = (() => {
    if (!amount) return '0';
    try { return parseUnits(amount, currentSourcePos.decimals).toString(); } catch { return '0'; }
  })();

  const route = useEnsoRoute(
    sourceToken.address,
    amountWei,
    address,
    '50',
    destToken.address,
  );

  const outputFormatted = route.amountOut
    ? formatTokenAmount(route.amountOut, destToken.decimals)
    : '';
  const outputUsd = route.amountOut
    ? Number(formatUnits(BigInt(route.amountOut), destToken.decimals)) *
      (tokenPrices[destToken.address.toLowerCase()] ?? 0)
    : 0;

  const addRecentTransaction = useAddRecentTransaction();

  const {
    sendTransaction: sendApprovalTx,
    data: approvalHash,
    isPending: isApprovalPending,
    isError: isApprovalError,
    reset: resetApproval,
  } = useSendTransaction();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  const {
    sendTransaction: sendRouteTx,
    data: routeHash,
    isPending: isRoutePending,
    isError: isRouteError,
    reset: resetRoute,
  } = useSendTransaction();
  const { isLoading: isRouteConfirming, isSuccess: isRouteConfirmed } =
    useWaitForTransactionReceipt({ hash: routeHash });

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
    if (ensoStep === 'approving' && isApprovalError) {
      resetApproval();
      setEnsoStep('idle');
    }
  }, [ensoStep, isApprovalError]);

  useEffect(() => {
    if (ensoStep === 'approving' && isApprovalConfirmed && route.tx) {
      resetApproval();
      setEnsoStep('routing');
      sendRouteTx({
        to: route.tx.to as `0x${string}`,
        data: route.tx.data as `0x${string}`,
        value: BigInt(route.tx.value || '0'),
      });
    }
  }, [ensoStep, isApprovalConfirmed, route.tx]);

  useEffect(() => {
    if (ensoStep === 'routing' && isRouteError) {
      resetRoute();
      setEnsoStep('idle');
    }
  }, [ensoStep, isRouteError]);

  useEffect(() => {
    if (ensoStep === 'routing' && isRouteConfirmed) {
      setEnsoStep('idle');
      setAmount('');
      resetRoute();
      onSuccess();
    }
  }, [ensoStep, isRouteConfirmed]);

  const isPending =
    ensoStep !== 'idle' ||
    isApprovalPending ||
    isApprovalConfirming ||
    isRoutePending ||
    isRouteConfirming;

  async function handleSwap() {
    if (!route.tx || !amount) return;
    try {
      const approval = await fetchEnsoApproval({
        fromAddress: address,
        tokenAddress: sourceToken.address,
        amount: amountWei,
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
    setEnsoStep('routing');
    sendRouteTx({
      to: route.tx.to as `0x${string}`,
      data: route.tx.data as `0x${string}`,
      value: BigInt(route.tx.value || '0'),
    });
  }

  const btnDisabled = isPending || !amount || amountWei === '0' || !route.tx || route.isLoading;
  const btnText =
    ensoStep === 'approving' ? 'Approving…' :
    ensoStep === 'routing' ? 'Swapping…' :
    route.isLoading ? 'Fetching route…' :
    `Swap to ${destToken.symbol}`;

  const destApy = apyMap[destToken.address.toLowerCase()];

  return (
    <div
      className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onDismiss}
    >
      <div
        className="bg-container w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl border border-white/[0.05]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Manage Position</h3>
          <button
            onClick={onDismiss}
            className="cursor-pointer text-text-muted hover:text-foreground transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Source */}
        <div className="bg-surface rounded-xl p-3 mb-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-muted">From</span>
            <button
              className="text-xs text-accent cursor-pointer hover:underline"
              onClick={() => setAmount(maxAmount)}
            >
              Max: {currentSourcePos.balance < 0.0001 ? '<0.0001' : currentSourcePos.balance.toFixed(4)}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="flex-1 bg-transparent text-foreground text-lg font-semibold outline-none placeholder:text-text-muted min-w-0"
              placeholder="0.0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <TokenSelector
              tokens={sourceTokens}
              selected={sourceToken}
              onSelect={t => { setSourceToken(t); setAmount(''); }}
            />
          </div>
          {currentSourcePos.usdValue > 0 && parseFloat(amount) > 0 && (
            <div className="text-xs text-text-muted mt-1">
              ≈ {formatUsd((parseFloat(amount) / currentSourcePos.balance) * currentSourcePos.usdValue)}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-1.5 text-text-muted text-lg">↓</div>

        {/* Destination */}
        <div className="bg-surface rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-muted">To</span>
            {destApy !== undefined && (
              <span className="text-xs text-green-400 font-medium">{destApy.toFixed(2)}% APY</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-lg font-semibold text-foreground min-w-0">
              {route.isLoading ? (
                <span className="text-text-muted text-sm">Fetching…</span>
              ) : outputFormatted ? (
                outputFormatted
              ) : (
                <span className="text-text-muted">0.0</span>
              )}
            </div>
            <TokenSelector
              tokens={destTokens}
              selected={destToken}
              onSelect={setDestToken}
            />
          </div>
          {outputUsd > 0 && (
            <div className="text-xs text-text-muted mt-1">≈ {formatUsd(outputUsd)}</div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleSwap}
          disabled={btnDisabled}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${
            btnDisabled
              ? 'bg-white/[0.04] text-text-muted cursor-not-allowed border border-white/[0.04]'
              : 'btn-primary text-[#1A0E00] cursor-pointer'
          }`}
        >
          {isPending && (
            <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin mr-2 align-middle" />
          )}
          {btnText}
        </button>
      </div>
    </div>
  );
}
