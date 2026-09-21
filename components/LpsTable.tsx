'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { LpCoin, LpData, LpToken, StakingData } from '@/app/types';
import { TokenPrices } from '@/lib/fetchTokenPrices';
import { gaEvent } from '@/lib/analytics';
import { smartShortNumber } from '@/lib/utils';
import { getProjectImageSrc } from './ScreenshotView';
import { StakingCard } from './StakingCard';

type SortKey = 'symbol' | 'project' | 'totalApr' | 'tvl';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Pool' },
  { key: 'project', label: 'Project' },
  { key: 'totalApr', label: 'Total APR' },
  { key: 'tvl', label: 'TVL' },
];

const CELL_CLASS = 'min-w-[125px] p-2 sm:p-3 text-primary-foreground text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap';

const formatApr = (apr: number) => apr ? `${apr.toFixed(2)}%` : '-';

// without a price for the received token the zap card can't compare output worth with deposit worth
const canZap = (lp: LpData) => !!lp.zap?.price;

// Shape expected by the Enso zap card and the positions, for one of the LP tokens
export const lpTokenToStakingData = (lp: LpData, token: LpToken): StakingData => ({
  symbol: lp.symbol,
  zapSymbol: token.symbol,
  project: lp.project,
  apy: token.apr,
  avg30: 0,
  avg60: 0,
  avg90: 0,
  tvl: lp.tvl,
  link: lp.link,
  image: getProjectImageSrc(lp.project),
  isLp: true,
  address: token.address,
  vaultPrice: token.price || 0,
  totalAssets: lp.tvl,
  totalAssets30d: 0,
  totalAssets90d: 0,
  decimals: token.decimals,
  zapDecimals: token.decimals,
});

function CoinIcon({ coin, sizeClassName }: { coin: LpCoin; sizeClassName: string }) {
  const [hasError, setHasError] = useState(false);
  const className = `rounded-full ${sizeClassName} ring-2 ring-card shrink-0`;

  if (hasError) {
    return (
      <span className={`${className} bg-muted text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center`}>
        {coin.symbol.slice(0, 1)}
      </span>
    );
  }
  return (
    <Image
      className={className}
      src={coin.image}
      alt={coin.symbol}
      width={32}
      height={32}
      onError={() => setHasError(true)}
    />
  );
}

// Overlapping icons of the pool's coins
export function LpCoinIcons({ coins, sizeClassName = 'w-5 h-5 sm:w-7 sm:h-7' }: { coins: LpCoin[]; sizeClassName?: string }) {
  return (
    <div className="flex -space-x-2 shrink-0">
      {coins.map(coin => <CoinIcon key={coin.address} coin={coin} sizeClassName={sizeClassName} />)}
    </div>
  );
}

// Takes the place of the zap card, in the same frame, for pools that can't be zapped into or managed here
export function LpInfoCard({ lp, message }: { lp: LpData; message: string }) {
  return (
    <div className="card-shine relative bg-container border border-white/[0.05] rounded-2xl">
      <div className="relative flex justify-center border-b border-white/[0.05] py-3.5 text-sm font-medium tracking-wide text-foreground">
        <span className="flex flex-row gap-1">
          <span>Earn with</span>
          <span className="font-bold">{lp.symbol}</span>
          <Image src={getProjectImageSrc(lp.project)} alt={lp.project} width={20} height={20} />
        </span>
        <span className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-3">
        <div className="bg-surface/50 border border-white/[0.04] rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Total APR</span>
            <span className="font-mono text-foreground">{formatApr(lp.totalApr)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">TVL</span>
            <span className="font-mono text-foreground">{smartShortNumber(lp.tvl, 1, true, true)}</span>
          </div>
        </div>
        <p className="text-text-muted text-center text-xs sm:text-sm">{message}</p>
      </div>
    </div>
  );
}

export function LpsTable({
  lps,
  tokenPrices,
  onDepositSuccess,
}: {
  lps: LpData[];
  tokenPrices: TokenPrices;
  onDepositSuccess?: () => void;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'totalApr', direction: 'desc' });
  const [selectedLp, setSelectedLp] = useState<LpData>();
  // the zap card stays mounted with the last zappable pool, so it doesn't reload when reopened
  const [zapLp, setZapLp] = useState<LpData | undefined>(() => lps.find(canZap));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen]);

  const sortedLps = [...lps].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSupply = (lp: LpData) => {
    gaEvent({ action: 'lp_supply_click', params: { category: 'lps', label: `${lp.project}-${lp.symbol}`, value: 0 } });
    setSelectedLp(lp);
    if (canZap(lp)) setZapLp(lp);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const isZapAvailable = !!selectedLp && canZap(selectedLp);

  const getZapUnavailableMessage = (lp: LpData) => {
    if (lp.zap) {
      return `Zapping into ${lp.symbol} isn't available right now, you can still deposit on ${lp.project}.`;
    }
    // a row whose zap gives this pool's LP token, which can then be deposited on the project
    const lpTokenZapRow = lps.find(other => canZap(other) && other.zap?.address.toLowerCase() === lp.address.toLowerCase());
    return `Zapping isn't available for ${lp.project} pools, deposit on ${lp.project} to earn this APR.`
      + (lpTokenZapRow ? ` You can first zap into the LP token from the ${lpTokenZapRow.symbol} ${lpTokenZapRow.project} row, then stake it on ${lp.project}.` : '');
  };

  return (
    <div className="w-full">
      <motion.div
        className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full text-left text-foreground min-w-[640px]">
            <thead>
              <tr className="text-muted-foreground">
                {COLUMNS.map(column => (
                  <th
                    key={column.key}
                    className="min-w-[125px] p-2 sm:p-3 text-sm sm:text-base lg:text-xl cursor-pointer hover:text-primary transition whitespace-nowrap"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label} {sortConfig.key === column.key && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                ))}
                <th className="p-2 sm:p-3" />
              </tr>
            </thead>
            <tbody>
              {sortedLps.map(lp => (
                <tr
                  key={`${lp.project}-${lp.address}`}
                  className="table-border hover:bg-muted/50 transition cursor-pointer sm:cursor-default"
                  onClick={() => {
                    if (window.innerWidth < 640) handleSupply(lp);
                  }}
                >
                  <td className={CELL_CLASS}>
                    <div className="flex items-center gap-2">
                      <LpCoinIcons coins={lp.coins} />
                      <span className="text-sm sm:text-base lg:text-lg" title={lp.name}>{lp.symbol}</span>
                    </div>
                  </td>
                  <td className={CELL_CLASS}>
                    <div className="flex items-center gap-2">
                      <Image
                        className="rounded-full w-5 h-5 sm:w-7 sm:h-7"
                        src={getProjectImageSrc(lp.project)}
                        alt={lp.project}
                        width={24}
                        height={24}
                      />
                      <span className="text-sm sm:text-base lg:text-lg">{lp.project}</span>
                    </div>
                  </td>
                  <td className={CELL_CLASS}>{formatApr(lp.totalApr)}</td>
                  <td className={CELL_CLASS}>{smartShortNumber(lp.tvl, 1, true, true)}</td>
                  <td className={CELL_CLASS}>
                    <button
                      className="cta-button text-sm sm:text-base"
                      onClick={e => {
                        e.stopPropagation();
                        handleSupply(lp);
                      }}
                    >
                      Supply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2">
          Pools that include at least one stablecoin from the Stables list
        </p>
      </motion.div>

      {/* Kept mounted and toggled like the stablecoins modal: the zap card loads wallet balances once
          instead of on every open, so the modal shows up with its final content */}
      <div
        className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
        style={{ display: isModalOpen ? 'flex' : 'none' }}
        onClick={closeModal}
      >
        <div
          className="bg-container p-4 sm:p-6 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-xl sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {zapLp?.zap && (
            <div hidden={!isZapAvailable}>
              <StakingCard
                stakingData={lpTokenToStakingData(zapLp, zapLp.zap)}
                tokenPrices={tokenPrices}
                onSuccess={() => {
                  closeModal();
                  onDepositSuccess?.();
                }}
              />
              {/* the received token doesn't earn the rewards by itself */}
              {zapLp.totalApr > zapLp.zap.apr && (
                <p className="text-muted-foreground text-xs sm:text-sm pt-3">
                  Zapping in gets you the LP token, which earns the {formatApr(zapLp.zap.apr)} base APR.
                  To also earn the {formatApr(zapLp.totalApr - zapLp.zap.apr)} rewards APR, stake your LP tokens in the pool&apos;s gauge on {zapLp.project}.
                </p>
              )}
            </div>
          )}
          {selectedLp && !isZapAvailable && (
            <LpInfoCard lp={selectedLp} message={getZapUnavailableMessage(selectedLp)} />
          )}

          {selectedLp && (
            <div className="flex gap-4 justify-end pt-3">
              <button
                onClick={closeModal}
                className="cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <a
                href={selectedLp.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => gaEvent({ action: 'lp_visit_project_click', params: { category: 'lps', label: `${selectedLp.project}-${selectedLp.symbol}`, value: 0 } })}
                className="cta-button inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground"
              >
                View on {selectedLp.project} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
