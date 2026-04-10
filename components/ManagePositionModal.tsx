'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { SUPPORTED_TOKENS, type SupportedToken } from '@/lib/tokens';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { type StakingData } from '@/app/types';
import { type VaultPosition } from './UserPositions';
import { useEnsoRoute } from '@/hooks/useEnsoRoute';
import { fetchEnsoApproval } from '@/lib/enso';
import { TokenSelector, type TokenMeta } from './TokenSelector';
import { formatUsd, formatTokenAmount, smartShortNumber } from '@/lib/utils';
import { addTxToast } from '@/lib/toastStore';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { SelectedOpportunity } from './SavingsOpportunities';
import { WorthDiffWarning } from './WorthDiffWarning';

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
  const sourceTokens = allPositions.map(positionToToken);
  const sourceMeta: Record<string, TokenMeta> = Object.fromEntries(
    allPositions.map(p => [p.tokenAddress.toLowerCase(), { apy: p.stakingData.apy, tvl: p.stakingData.tvl }])
  );
  const sourceBals: Record<string, string> = Object.fromEntries(
    allPositions.map(p => [p.tokenAddress.toLowerCase(), p.balance < 0.0001 ? '<0.0001' : p.balance.toFixed(4)])
  );

  const [sourceToken, setSourceToken] = useState<SupportedToken>(() => positionToToken(position));
  const [amount, setAmount] = useState('');
  const [ensoStep, setEnsoStep] = useState<EnsoStep>('idle');

  const { tokens: allDestTokens, metaMap: destMeta } = buildDestTokens(yieldData, tokenPrices);
  const destTokens = allDestTokens.filter(t => t.address.toLowerCase() !== sourceToken.address.toLowerCase());
  const [destToken, setDestToken] = useState<SupportedToken>(() => {
    return destTokens.find(t => t.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) ?? destTokens[0];
  });

  const currentSourcePos = allPositions.find(
    p => p.tokenAddress.toLowerCase() === sourceToken.address.toLowerCase()
  ) ?? position;

  const maxAmount = formatUnits(currentSourcePos.amountWei, currentSourcePos.decimals);

  const amountWei = (() => {
    if (!amount) return '0';
    try { return parseUnits(amount, currentSourcePos.decimals).toString(); } catch { return '0'; }
  })();

  const route = useEnsoRoute(sourceToken.address, amountWei, address, '50', destToken.address);

  const outputFormatted = route.amountOut ? formatTokenAmount(route.amountOut, destToken.decimals) : '';
  const outputUsd = route.amountOut
    ? Number(formatUnits(BigInt(route.amountOut), destToken.decimals)) * (((destToken.vaultPrice || tokenPrices[destToken.address.toLowerCase()]) ?? 0))
    : 0;

  const inputUsd = currentSourcePos.usdValue > 0 && parseFloat(amount) > 0
    ? (parseFloat(amount) / currentSourcePos.balance) * currentSourcePos.usdValue
    : 0;

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
    try {
      const approval = await fetchEnsoApproval({ fromAddress: address, tokenAddress: sourceToken.address, amount: amountWei });
      if (approval.tx?.data && approval.tx.data !== '0x') {
        setEnsoStep('approving');
        sendApprovalTx({ to: approval.tx.to as `0x${string}`, data: approval.tx.data as `0x${string}`, value: BigInt(approval.tx.value || '0') });
        return;
      }
    } catch (err) { console.error('Approval check failed:', err); }
    setEnsoStep('routing');
    sendRouteTx({ to: route.tx.to as `0x${string}`, data: route.tx.data as `0x${string}`, value: BigInt(route.tx.value || '0') });
  }

  const worthDiff = inputUsd && outputUsd ? (inputUsd - outputUsd) / inputUsd : 0;
  const warnHighWorthDiff = worthDiff > 0.01;
  const blockHighWorthDiff = worthDiff > 0.05;

  const btnDisabled = isPending || !amount || amountWei === '0' || !route.tx || route.isLoading || blockHighWorthDiff;
  const btnText =
    ensoStep === 'approving' ? 'Approving…' :
      ensoStep === 'routing' ? 'Swapping…' :
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
          <button onClick={onDismiss} className="cursor-pointer text-text-muted hover:text-foreground transition text-lg leading-none">✕</button>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
          {/* Main input container — mirrors StakingCard deposit box */}
          <div className="bg-surface/50 border border-white/[0.04] rounded-xl p-4">

            {/* YOU SWAP row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">Withdraw From</span>
              <button
                onClick={() => setAmount(maxAmount)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer group"
              >
                <span className="text-muted-foreground">Bal {currentSourcePos.balance < 0.0001 ? '<0.0001' : currentSourcePos.balance.toFixed(4)}</span>
                <span className="text-accent font-semibold ml-1 group-hover:text-accent-hover transition-colors">Max</span>
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

            {/* TO row — separator + destination */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <div>
                <span className="text-text-muted text-[10px] uppercase tracking-[0.15em] font-medium">To</span>
              </div>
              <TokenSelector
                tokens={destTokens}
                selected={destToken}
                onSelect={setDestToken}
                metadata={destMeta}
              />
            </div>
          </div>

          {/* Output preview */}
          {amountWei !== '0' && (
            <div className="border border-white/[0.04] rounded-xl px-4 py-3">
              {route.isLoading ? (
                <div className="flex justify-center py-0.5">
                  <span className="inline-block w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
              ) : route.error ? (
                <div className="text-sm text-red-400 text-center">{route.error}</div>
              ) : outputFormatted ? (
                destToken?.apy ? <SelectedOpportunity
                  token={destToken}
                  apy={destToken.apy}
                  totalAssets={destToken.totalAssets}
                  priceUsd={destToken.vaultPrice}
                  depositUsd={inputUsd}
                  outputUsd={outputUsd}
                  estimatedOutputFormatted={outputFormatted}
                  isConnected={true}
                /> : <div className="flex justify-between items-start text-sm">
                  <span className="text-text-muted">Estimated output</span>
                  <div className="text-right">
                    <div className="font-mono text-foreground">~{outputFormatted} {destToken.symbol}</div>
                    {outputUsd > 0 && (
                      <div className="text-text-muted text-xs">≈{formatUsd(outputUsd)}</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <WorthDiffWarning warnHighWorthDiff={warnHighWorthDiff} blockHighWorthDiff={blockHighWorthDiff} />

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
        </div>
      </div>
    </div>
  );
}
