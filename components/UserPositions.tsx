'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import Image from 'next/image';
import { fetchEnsoBalances } from '@/lib/enso';
import { type TokenPrices } from '@/lib/fetchTokenPrices';
import { type StakingData } from '@/app/types';
import { formatUsd } from '@/lib/utils';
import { ManagePositionModal } from './ManagePositionModal';

export interface VaultPosition {
  stakingData: StakingData;
  balance: number;
  usdValue: number;
  estimatedYearlyYield: number;
  tokenAddress: `0x${string}`;
  decimals: number;
  amountWei: bigint;
}

export function UserPositions({
  data,
  tokenPrices,
}: {
  data: StakingData[];
  tokenPrices: TokenPrices;
}) {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [managingPosition, setManagingPosition] = useState<VaultPosition | null>(null);

  const loadPositions = useCallback(async (addr: `0x${string}`) => {
    setIsLoading(true);
    try {
      const balances = await fetchEnsoBalances(addr);
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

      setPositions(found.sort((a, b) => b.usdValue - a.usdValue));
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (address) loadPositions(address);
    else setPositions([]);
  }, [address, loadPositions]);

  const totalYearlyUsd = positions.reduce((prev, curr) => prev+curr.estimatedYearlyYield, 0);

  if (!isConnected || isLoading || (!isLoading && positions.length === 0)) return null;

  return (
    <>
      <div className="w-full">
        <h2 className="text-lg font-semibold text-foreground mb-3">Your Positions <b className="text-success">(+{formatUsd(totalYearlyUsd)} yearly)</b></h2>
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
                  <Image
                    src={pos.stakingData.image}
                    alt={pos.stakingData.symbol}
                    width={36}
                    height={36}
                    className="rounded-full shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {pos.stakingData.zapSymbol || pos.stakingData.symbol}
                      <span className="text-muted-foreground font-normal ml-1 text-xs">
                        ({pos.stakingData.project})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pos.balance < 0.0001 ? '<0.0001' : pos.balance.toFixed(4)} tokens
                    </div>
                    {/* Mobile-only USD row */}
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {formatUsd(pos.usdValue)} · <span className="text-green-400">+{formatUsd(pos.estimatedYearlyYield)}/yr</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 pr-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-foreground">{formatUsd(pos.usdValue)}</div>
                    <div className="text-xs text-muted-foreground">Value</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-green-400">+{formatUsd(pos.estimatedYearlyYield)}/yr</div>
                    <div className="text-xs text-muted-foreground">{pos.stakingData.apy.toFixed(2)}% APY</div>
                  </div>
                  <button
                    onClick={() => setManagingPosition(pos)}
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
          allPositions={positions}
          yieldData={data}
          tokenPrices={tokenPrices}
          address={address}
          onDismiss={() => setManagingPosition(null)}
          onSuccess={() => {
            setManagingPosition(null);
            loadPositions(address);
          }}
        />
      )}
    </>
  );
}
