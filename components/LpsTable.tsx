'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { LpData, LpToken, StakingData } from '@/app/types';
import { TokenPrices } from '@/lib/fetchTokenPrices';
import { gaEvent } from '@/lib/analytics';
import { smartShortNumber } from '@/lib/utils';
import { captureAsPng, fetchAsDataUrl, fetchDataUrlMap } from '@/lib/screenshot';
import type { PromoBullet } from '@/lib/generatePromoImage';
import { getLpKey, getProjectImageSrc, LpsScreenshotView } from './ScreenshotView';
import { InfoCard } from './InfoCard';
import { LpCoinIcons } from './CoinIcons';
import { GeneratedImage, HighlightModeHint, ImagePreviewModal, ScreenshotMenu } from './ScreenshotMenu';
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

// rows in the screenshots, more when the highlighted pair is further down
const SCREENSHOT_ROWS = 10;

const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// What depositing gets you, listed in the pair's promo image
const getPromoBullets = (lp: LpData): PromoBullet[] => [
  ...(canZap(lp) ? [{ icon: 'zap' as const, text: 'Zap-in with USDC or another stable' }] : []),
  // the zapped LP token earns the base APR, the rewards go to the gauge stakers
  ...(lp.zap && lp.totalApr > lp.zap.apr
    ? [{ icon: 'layers' as const, text: `${formatApr(lp.zap.apr)} base APR, ${formatApr(lp.totalApr - lp.zap.apr)} more when staked in the gauge` }]
    : []),
  ...(lp.project === 'Yearn' ? [{ icon: 'recycle' as const, text: 'Auto-compounding' }] : []),
  ...(lp.project === 'Convex' ? [{ icon: 'layers' as const, text: 'Boosted CRV + CVX rewards' }] : []),
  ...(lp.project === 'Stake DAO' ? [{ icon: 'layers' as const, text: 'Boosted CRV rewards' }] : []),
  { icon: 'unlock', text: 'No lockup' },
];

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

// Takes the place of the zap card, in the same frame, for pools that can't be zapped into or managed here
export function LpInfoCard({ lp, message }: { lp: LpData; message: string }) {
  return (
    <InfoCard
      title={<><span>Earn with</span><span className="font-bold">{lp.symbol}</span></>}
      image={getProjectImageSrc(lp.project)}
      imageAlt={lp.project}
      stats={[
        { label: 'Total APR', value: formatApr(lp.totalApr) },
        { label: 'TVL', value: smartShortNumber(lp.tvl, 1, true, true) },
      ]}
      message={message}
    />
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
  // picking the pair to generate a promo image for
  const [promoMode, setPromoMode] = useState(false);
  const [preview, setPreview] = useState<GeneratedImage | null>(null);
  const [screenshot, setScreenshot] = useState<{ rows: LpData[]; imageMap: Record<string, string>; highlightedKey?: string } | null>(null);
  const [screenshotKey, setScreenshotKey] = useState(0);
  const screenshotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModalOpen && !promoMode && !preview) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (preview) setPreview(null);
      else if (promoMode) setPromoMode(false);
      else setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen, promoMode, preview]);

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

  // Renders the off-screen table and captures it as a PNG data URL
  const captureTable = async (highlighted?: LpData): Promise<string | null> => {
    const highlightedIndex = highlighted ? sortedLps.indexOf(highlighted) : -1;
    const rows = sortedLps.slice(0, Math.max(SCREENSHOT_ROWS, highlightedIndex + 1));
    const imageMap = await fetchDataUrlMap(rows.flatMap(lp => [...lp.coins.map(coin => coin.image), getProjectImageSrc(lp.project)]));

    flushSync(() => {
      setScreenshotKey(k => k + 1);
      setScreenshot({ rows, imageMap, highlightedKey: highlighted && getLpKey(highlighted) });
    });
    if (!screenshotRef.current) return null;

    try {
      return await captureAsPng(screenshotRef.current);
    } finally {
      setScreenshot(null);
    }
  };

  const handleScreenshot = async () => {
    const dataUrl = await captureTable();
    if (dataUrl) setPreview({ dataUrl, filename: 'stable-pairs.png' });
  };

  const handlePromoClick = async (lp: LpData) => {
    setPromoMode(false);
    const tableDataUrl = await captureTable(lp);
    if (!tableDataUrl) return;

    const [coinImageUrls, projectImageUrl, { generatePromoImage }] = await Promise.all([
      Promise.all(lp.coins.map(coin => fetchAsDataUrl(coin.image, 128))),
      fetchAsDataUrl(getProjectImageSrc(lp.project)),
      import('@/lib/generatePromoImage'),
    ]);
    const rank = [...lps].sort((a, b) => b.totalApr - a.totalApr).indexOf(lp) + 1;
    const dataUrl = await generatePromoImage(tableDataUrl, {
      symbol: lp.symbol,
      project: lp.project,
      projectLabel: lp.project,
      apy: lp.totalApr,
      apyLabel: 'Total APR',
      avg30: 0,
      avg90: 0,
      tvl: lp.tvl,
      tokenImageUrl: '',
      coinImageUrls,
      projectImageUrl,
      link: lp.link,
      underlyingStable: '',
      underlyingSymbol: '',
      rankLabel: 'In Stable Pairs on stableyields.info',
      bullets: getPromoBullets(lp),
    }, rank, document.documentElement.classList.contains('dark'));

    setPreview({ dataUrl, filename: `stable-pairs-${toSlug(lp.symbol)}-${toSlug(lp.project)}.png` });
  };

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
      {promoMode && (
        <HighlightModeHint text="Click on a stable pair to generate an image for it" onCancel={() => setPromoMode(false)} />
      )}
      <motion.div
        className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <ScreenshotMenu highlightLabel="Highlight one pair" onScreenshot={handleScreenshot} onHighlight={() => setPromoMode(true)} />
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
                    key={getLpKey(lp)}
                    className={`table-border hover:bg-muted/50 transition cursor-pointer ${promoMode ? '' : 'sm:cursor-default'}`}
                    onClick={() => {
                      if (promoMode) handlePromoClick(lp);
                      else if (window.innerWidth < 640) handleSupply(lp);
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
                          if (promoMode) handlePromoClick(lp);
                          else handleSupply(lp);
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

      <ImagePreviewModal image={preview} onClose={() => setPreview(null)} />

      {/* Off-screen screenshot template — rendered only during capture */}
      {screenshot && (
        <LpsScreenshotView
          key={screenshotKey}
          ref={screenshotRef}
          rows={screenshot.rows}
          sortConfig={sortConfig}
          imageMap={screenshot.imageMap}
          highlightedKey={screenshot.highlightedKey}
        />
      )}
    </div>
  );
}
