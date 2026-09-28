'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { readContracts } from 'wagmi/actions';
import { erc20Abi, formatUnits } from 'viem';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { fetchEnsoBalances } from '@/lib/enso';
import { wagmiConfig } from '@/lib/wagmi';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { type LeverageData, type LpData, type LpToken, type StakingData } from '@/app/types';
import { commify, formatUsd } from '@/lib/utils';
import { fetchLeveragePositions, type LeveragePosition } from '@/lib/leverage-positions';
import { ManagePositionModal } from './ManagePositionModal';
import { LpInfoCard, lpTokenToStakingData } from './LpsTable';
import { LpCoinIcons } from './CoinIcons';
import { InfoCard } from './InfoCard';
import { getProjectImageSrc } from './ScreenshotView';
import { formatPoints, PointsPill } from './PointsPill';

export interface VaultPosition {
  stakingData: StakingData;
  balance: number;
  usdValue: number;
  estimatedYearlyYield: number;
  tokenAddress: `0x${string}`;
  decimals: number;
  amountWei: bigint;
  // set for LP positions
  lp?: LpData;
  // set for leveraged positions, which are held in a lending market
  leverage?: LeveragePosition;
  // market price to check swap output worth against, when the valuation price can differ from it
  marketPrice?: number;
}

type LpWithPosition = LpData & { position: LpToken };

// LP positions are only routable by Enso when the project supports its zap (not for staked Convex positions)
const isManageable = (pos: VaultPosition) => !pos.leverage && (!pos.lp || !!pos.lp.zap);

// dust isn't worth a row
const MIN_POSITION_USD = 1;

// a month being 365/12 days, a twelfth of the yearly yield
const toMonthly = (yearly: number) => yearly / 12;

// the popup has the room to show amounts in full, the rows keep the shortened ones
const formatFullUsd = (value: number) => `$${commify(value)}`;

const formatLeverage = (leverage: number) => `${leverage.toFixed(2)}x`;
const getPositionPoints = (position: LeveragePosition) =>
  position.market.pointsMultiplier ? position.market.pointsMultiplier * position.leverage : 0;
const formatApy = (apy: number) => `${apy.toFixed(2)}%`;

// A leveraged position is worth its equity, and earns the net APY on it
const toVaultPosition = (position: LeveragePosition): VaultPosition => ({
  stakingData: {
    symbol: position.market.collateral.symbol,
    project: position.market.project,
    apy: position.netApy,
    avg30: 0,
    avg60: 0,
    avg90: 0,
    tvl: position.market.liquidity,
    link: position.market.link,
    image: getProjectImageSrc(position.market.project),
    vaultPrice: 0,
    totalAssets: 0,
    totalAssets30d: 0,
    totalAssets90d: 0,
    decimals: 18,
    zapDecimals: 18,
  },
  balance: position.deposits,
  usdValue: position.equity,
  estimatedYearlyYield: position.equity * position.netApy / 100,
  tokenAddress: position.market.id as `0x${string}`,
  decimals: 18,
  amountWei: BigInt(0),
  leverage: position,
});

async function fetchLpPositions(account: `0x${string}`, lps: LpWithPosition[]): Promise<VaultPosition[]> {
  if (!lps.length) return [];
  const balances = await readContracts(wagmiConfig, {
    allowFailure: true,
    contracts: lps.map(lp => ({
      address: lp.position.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [account] as const,
    })),
  });
  return lps.flatMap((lp, i) => {
    const { status, result } = balances[i];
    if (status !== 'success' || !result) return [];
    const { position } = lp;
    const balance = Number(formatUnits(result, position.decimals));
    const usdValue = balance * (position.price || 0);
    return [{
      stakingData: lpTokenToStakingData(lp, position),
      balance,
      usdValue,
      estimatedYearlyYield: usdValue * position.apr / 100,
      tokenAddress: position.address,
      decimals: position.decimals,
      amountWei: result,
      lp,
      // positions are valued from the pools' virtual prices, which ignore coins trading off $1
      marketPrice: lp.zap?.address === position.address ? lp.zap.price : undefined,
    }];
  });
}

export function UserPositions({
  data,
  lps,
  leverage,
  tokenPrices,
  refreshKey,
}: {
  data: StakingData[];
  lps: LpData[];
  leverage: LeverageData[];
  tokenPrices: TokenPrices;
  refreshKey?: number;
}) {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInited, setIsInited] = useState(false);
  const [managingPosition, setManagingPosition] = useState<VaultPosition | null>(null);
  const [infoPosition, setInfoPosition] = useState<VaultPosition | null>(null);

  // positions can be moved to any stablecoin or zappable LP
  const destinations = useMemo(() => [
    ...data,
    ...lps.flatMap(lp => lp.zap?.price ? [lpTokenToStakingData(lp, lp.zap)] : []),
  ], [data, lps]);

  const loadPositions = useCallback(async (addr: `0x${string}`) => {
    setIsLoading(true);
    try {
      const lpsWithPosition = lps.filter((lp): lp is LpWithPosition => !!lp.position);
      const [balances, lpPositions, leveragePositions] = await Promise.all([
        fetchEnsoBalances(addr),
        fetchLpPositions(addr, lpsWithPosition).catch(err => {
          console.error('Failed to fetch LP positions:', err);
          return [];
        }),
        fetchLeveragePositions(addr, leverage).catch(err => {
          console.error('Failed to fetch leveraged positions:', err);
          return [];
        }),
      ]);
      const found: VaultPosition[] = [];

      for (const item of data) {
        const tokenAddr = (item.zapAddress || item.address) as `0x${string}` | undefined;
        if (!tokenAddr) continue;

        const bal = balances.find(b => b.token.toLowerCase() === tokenAddr.toLowerCase());
        if (!bal || BigInt(bal.amount) === 0n) continue;

        const decimals = item.zapDecimals || item.decimals;
        const amountWei = BigInt(bal.amount);
        const balance = Number(formatUnits(amountWei, decimals));
        const usdValue = balance * item.vaultPrice;
        const estimatedYearlyYield = usdValue * item.apy / 100;

        found.push({
          stakingData: item,
          balance,
          usdValue,
          estimatedYearlyYield,
          tokenAddress: tokenAddr,
          decimals,
          amountWei,
        });
      }

      setPositions([...found, ...lpPositions, ...leveragePositions.map(toVaultPosition)]
        .filter(position => position.usdValue >= MIN_POSITION_USD)
        .sort((a, b) => b.usdValue - a.usdValue));
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setIsLoading(false);
      setIsInited(true);
    }
  }, [data, lps, leverage]);

  useEffect(() => {
    if (address) loadPositions(address);
    else setPositions([]);
  }, [address, loadPositions, refreshKey]);

  useEffect(() => {
    if (!infoPosition) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInfoPosition(null);
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [infoPosition]);

  const totalYearlyUsd = positions.reduce((prev, curr) => prev+curr.estimatedYearlyYield, 0);
  const infoLeverage = infoPosition?.leverage;
  const infoProject = infoLeverage?.market.project || infoPosition?.lp?.project || '';
  const infoLink = infoLeverage?.market.link || infoPosition?.lp?.link || '';

  if (!isConnected || (isLoading && !isInited) || (!isLoading && positions.length === 0)) return null;

  return (
    <>
      <div className="w-full">
        <h2 className="text-lg font-semibold text-foreground mb-3">Your Positions <b className="text-success">(+{formatUsd(toMonthly(totalYearlyUsd))} monthly)</b></h2>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading positions…</div>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map(pos => (
              <div
                key={pos.tokenAddress}
                className="flex items-center justify-between bg-container border border-white/[0.05] rounded-xl px-4 py-3 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {pos.lp || pos.leverage ? (
                    <LpCoinIcons coins={pos.lp?.coins || pos.leverage!.market.collateral.coins} sizeClassName="w-8 h-8" />
                  ) : (
                    <Image
                      src={pos.stakingData.image}
                      alt={pos.stakingData.symbol}
                      width={36}
                      height={36}
                      className="rounded-full shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    {/* on narrow screens the project goes under long LP names instead of being cut */}
                    <div className="flex flex-wrap items-baseline gap-x-1 font-semibold text-foreground text-sm">
                      <span className="truncate">{pos.stakingData.zapSymbol || pos.stakingData.symbol}</span>
                      <span className="text-muted-foreground font-normal text-xs">
                        ({pos.stakingData.project})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pos.leverage
                        ? `${formatUsd(pos.leverage.deposits)} deposits · ${formatUsd(pos.leverage.debt)} debt`
                        : `${pos.balance < 1 ? '<1' : commify(pos.balance)} tokens`}
                    </div>
                    {/* Mobile-only USD row */}
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {formatUsd(pos.usdValue)} · <span className="text-green-400">+{formatUsd(toMonthly(pos.estimatedYearlyYield))}/mo</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 pr-6">
                  {!!pos.leverage && !!getPositionPoints(pos.leverage) && (
                    <div className="text-right hidden sm:block">
                      <div className="flex justify-end">
                        <PointsPill
                          multiplier={getPositionPoints(pos.leverage)}
                          tooltip={`${formatPoints(getPositionPoints(pos.leverage))} Ethena sats on your equity, from ${formatPoints(pos.leverage.market.pointsMultiplier!)} per dollar deposited at ${formatLeverage(pos.leverage.leverage)}`}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Ethena sats</div>
                    </div>
                  )}
                  {pos.leverage && (
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold text-foreground">{formatLeverage(pos.leverage.leverage)}</div>
                      <div className="text-xs text-muted-foreground">Est. leverage</div>
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-foreground">{formatUsd(pos.usdValue)}</div>
                    <div className="text-xs text-muted-foreground">{pos.leverage ? 'Equity' : 'Value'}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-green-400">+{formatUsd(toMonthly(pos.estimatedYearlyYield))}/mo</div>
                    <div className="text-xs text-muted-foreground">
                      {pos.stakingData.apy.toFixed(2)}% {pos.leverage ? 'Net Equity APY' : 'APY'}
                    </div>
                  </div>
                  <button
                    onClick={() => isManageable(pos) ? setManagingPosition(pos) : setInfoPosition(pos)}
                    className="cta-button text-sm font-bold"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {managingPosition && address && (
        <ManagePositionModal
          position={managingPosition}
          allPositions={positions.filter(isManageable)}
          yieldData={destinations}
          tokenPrices={tokenPrices}
          address={address}
          onDismiss={() => setManagingPosition(null)}
          onSuccess={() => {
            setManagingPosition(null);
            loadPositions(address);
          }}
        />
      )}

      {infoPosition && (infoPosition.lp || infoLeverage) && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={() => setInfoPosition(null)}
        >
          <div
            className="bg-container p-4 sm:p-6 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-xl sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {infoLeverage ? (
              <InfoCard
                title={<><span className="font-bold">{infoLeverage.market.collateral.symbol}</span><span>loop on</span></>}
                image={getProjectImageSrc(infoProject)}
                imageAlt={infoProject}
                stats={[
                  { label: 'Deposits', value: formatFullUsd(infoLeverage.deposits) },
                  { label: `${infoLeverage.market.debt.symbol} debt`, value: formatFullUsd(infoLeverage.debt) },
                  { label: 'Equity', value: formatFullUsd(infoLeverage.equity) },
                  { label: 'Est. leverage', value: formatLeverage(infoLeverage.leverage) },
                  { label: `${infoLeverage.market.collateral.symbol} APY`, value: formatApy(infoLeverage.market.collateralApy) },
                  {
                    label: `${infoLeverage.market.debt.symbol} borrow APY`,
                    value: `${formatApy(infoLeverage.market.borrowApy)}${infoLeverage.market.fixedBorrowRate ? ' fixed' : ''}`,
                  },
                  { label: 'Net equity APY', value: formatApy(infoLeverage.netApy) },
                  ...(getPositionPoints(infoLeverage) ? [{
                    label: 'Ethena sats',
                    value: `${formatPoints(getPositionPoints(infoLeverage))} (${formatPoints(infoLeverage.market.pointsMultiplier!)} per dollar deposited)`,
                  }] : []),
                ]}
                message={`Adding to, repaying or closing this position happens on ${infoProject}.`}
              />
            ) : (
              <LpInfoCard
                lp={infoPosition.lp!}
                message={`Managing ${infoProject} positions isn't available here, withdraw or claim your rewards on ${infoProject}.`}
              />
            )}
            <div className="flex gap-4 justify-end pt-3">
              <button
                onClick={() => setInfoPosition(null)}
                className="cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <a
                href={infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground"
              >
                View on {infoProject} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
