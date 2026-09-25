'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { LeverageData, LpCoin } from '@/app/types';
import { gaEvent } from '@/lib/analytics';
import { smartShortNumber } from '@/lib/utils';
import { captureAsPng, fetchAsDataUrl, fetchDataUrlMap } from '@/lib/screenshot';
import type { PromoBullet } from '@/lib/generatePromoImage';
import { getProjectImageSrc, LeverageScreenshotView } from './ScreenshotView';
import { GeneratedImage, HighlightModeHint, ImagePreviewModal, ScreenshotMenu } from './ScreenshotMenu';
import { LpCoinIcons } from './CoinIcons';
import { InfoCard } from './InfoCard';

// one step smaller than the other tables, this one has more columns to fit
const CELL_CLASS = 'min-w-[80px] p-2 text-primary-foreground text-sm sm:text-base font-bold whitespace-nowrap';

// rows in the screenshots, more when the highlighted market is further down
const SCREENSHOT_ROWS = 10;

const formatPercent = (value: number) => value ? `${value.toFixed(2)}%` : '-';
const formatLeverage = (leverage: number) => `${leverage.toFixed(1)}x`;
const formatBorrowApy = (market: LeverageData) => `${formatPercent(market.borrowApy)}${market.fixedBorrowRate ? ' fixed' : ''}`;
const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const Pill = ({ children, title, tone = 'border-border bg-muted/40 text-muted-foreground' }: { children: ReactNode; title?: string; tone?: string }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-normal whitespace-nowrap ${tone}`}
  >
    {children}
  </span>
);

// APY earned on one side, rate paid on the other
const EARNED_TONE = 'border-success/30 bg-success/10 text-muted-foreground';
const PAID_TONE = 'border-accent/30 bg-accent/10 text-muted-foreground';

const TokenCell = ({ coins, symbol, pills }: { coins: LpCoin[]; symbol: string; pills: ReactNode }) => (
  <div className="flex items-center gap-2">
    <LpCoinIcons coins={coins} />
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm sm:text-base">{symbol}</span>
      <span className="flex items-center gap-1">{pills}</span>
    </div>
  </div>
);

// What the market offers, listed in its promo image
const getPromoBullets = (market: LeverageData): PromoBullet[] => [
  { icon: 'layers', text: `${market.collateral.symbol} earns ${formatPercent(market.collateralApy)} APY` },
  { icon: 'zap', text: `Borrow ${market.debt.symbol} at ${formatBorrowApy(market)}` },
  { icon: 'recycle', text: `Loop up to ${formatLeverage(market.maxLeverage)}, the max its ${market.maxLtv.toFixed(1)}% LTV allows` },
];

interface Column {
  key: string;
  label: string;
  // shown when hovering the column header
  title?: string;
  value: (market: LeverageData) => number | string;
  render: (market: LeverageData) => ReactNode;
}

const COLUMNS: Column[] = [
  {
    key: 'collateral',
    label: 'Collateral',
    title: 'Deposited token and the APY it earns',
    value: market => market.collateral.symbol.toLowerCase(),
    render: market => (
      <TokenCell
        coins={market.collateral.coins}
        symbol={market.collateral.symbol}
        pills={<Pill tone={EARNED_TONE}>{formatPercent(market.collateralApy)} APY</Pill>}
      />
    ),
  },
  {
    key: 'project',
    label: 'Project',
    title: 'Lending market the position is opened on',
    value: market => `${market.project}${market.version || ''}`,
    render: market => (
      <TokenCell
        coins={[{ address: market.project, symbol: market.project, image: getProjectImageSrc(market.project) }]}
        symbol={market.project}
        // markets of a same collateral are told apart by their version, like on Curve
        pills={market.version ? <Pill title={market.name}>V{market.version}</Pill> : null}
      />
    ),
  },
  {
    key: 'debt',
    label: 'Debt',
    title: 'Borrowed token and the rate paid on it',
    value: market => market.borrowApy,
    render: market => (
      <TokenCell
        coins={[market.debt]}
        symbol={market.debt.symbol}
        pills={<Pill tone={PAID_TONE}>{formatBorrowApy(market)} APY</Pill>}
      />
    ),
  },
  {
    key: 'liquidity',
    label: 'Liquidity',
    title: 'Left to borrow in the market',
    value: market => market.liquidity,
    render: market => smartShortNumber(market.liquidity, 1, true, true),
  },
  {
    key: 'utilization',
    label: 'Utilisation',
    title: 'Share of the market that is already borrowed',
    value: market => market.utilization ?? -1,
    render: market => market.utilization === undefined ? '-' : formatPercent(market.utilization),
  },
  {
    key: 'maxNetApy',
    label: 'Max Net APY',
    title: 'What the collateral earns at the max leverage, minus what the borrowed amount costs',
    value: market => market.maxNetApy,
    render: market => (
      <div className="flex flex-col items-start gap-1">
        <span className={market.maxNetApy > 0 ? 'text-success' : ''}>{formatPercent(market.maxNetApy)}</span>
        <Pill title={`Max LTV ${market.maxLtv.toFixed(1)}%`}>at {formatLeverage(market.maxLeverage)}</Pill>
      </div>
    ),
  },
];

export function LeverageTable({ markets }: { markets: LeverageData[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'maxNetApy', direction: 'desc' });
  const [selectedMarket, setSelectedMarket] = useState<LeverageData>();
  // picking the market to generate a promo image for
  const [promoMode, setPromoMode] = useState(false);
  const [preview, setPreview] = useState<GeneratedImage | null>(null);
  const [screenshot, setScreenshot] = useState<{ rows: LeverageData[]; imageMap: Record<string, string>; highlightedId?: string } | null>(null);
  const [screenshotKey, setScreenshotKey] = useState(0);
  const screenshotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedMarket && !promoMode && !preview) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (preview) setPreview(null);
      else if (promoMode) setPromoMode(false);
      else setSelectedMarket(undefined);
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [selectedMarket, promoMode, preview]);

  const getValue = COLUMNS.find(column => column.key === sortConfig.key)?.value || (() => 0);
  const sortedMarkets = [...markets].sort((a, b) => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleLeverage = (market: LeverageData) => {
    gaEvent({ action: 'leverage_market_click', params: { category: 'leverage', label: `${market.project}-${market.name}`, value: 0 } });
    setSelectedMarket(market);
  };

  const closeModal = () => setSelectedMarket(undefined);

  // Renders the off-screen table and captures it as a PNG data URL
  const captureTable = async (highlighted?: LeverageData): Promise<string | null> => {
    const highlightedIndex = highlighted ? sortedMarkets.indexOf(highlighted) : -1;
    const rows = sortedMarkets.slice(0, Math.max(SCREENSHOT_ROWS, highlightedIndex + 1));
    const imageMap = await fetchDataUrlMap(rows.flatMap(market => [
      ...market.collateral.coins.map(coin => coin.image),
      market.debt.image,
      getProjectImageSrc(market.project),
    ]));

    flushSync(() => {
      setScreenshotKey(k => k + 1);
      setScreenshot({ rows, imageMap, highlightedId: highlighted?.id });
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
    if (dataUrl) setPreview({ dataUrl, filename: 'leverage.png' });
  };

  const handlePromoClick = async (market: LeverageData) => {
    setPromoMode(false);
    const tableDataUrl = await captureTable(market);
    if (!tableDataUrl) return;

    const [coinImageUrls, projectImageUrl, { generatePromoImage }] = await Promise.all([
      Promise.all(market.collateral.coins.map(coin => fetchAsDataUrl(coin.image, 128))),
      fetchAsDataUrl(getProjectImageSrc(market.project)),
      import('@/lib/generatePromoImage'),
    ]);
    const rank = [...markets].sort((a, b) => b.maxNetApy - a.maxNetApy).indexOf(market) + 1;
    const dataUrl = await generatePromoImage(tableDataUrl, {
      symbol: market.collateral.symbol,
      project: market.project,
      projectLabel: market.project,
      apy: market.maxNetApy,
      apyLabel: 'Max Net APY',
      avg30: 0,
      avg90: 0,
      tvl: market.liquidity,
      tvlLabel: 'Liquidity',
      tokenImageUrl: '',
      coinImageUrls,
      projectImageUrl,
      link: market.link,
      underlyingStable: '',
      underlyingSymbol: '',
      rankLabel: 'In Leverage on stableyields.info',
      bullets: getPromoBullets(market),
    }, rank, document.documentElement.classList.contains('dark'));

    setPreview({ dataUrl, filename: `leverage-${toSlug(market.collateral.symbol)}-${toSlug(market.project)}.png` });
  };

  return (
    <div className="w-full">
      {promoMode && (
        <HighlightModeHint text="Click on a leverage opportunity to generate an image for it" onCancel={() => setPromoMode(false)} />
      )}
      <motion.div
        className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <ScreenshotMenu highlightLabel="Highlight one market" onScreenshot={handleScreenshot} onHighlight={() => setPromoMode(true)} />
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full text-left text-foreground min-w-[760px]">
              <thead>
                <tr className="text-muted-foreground">
                  {COLUMNS.map(column => (
                    // the labels wrap instead of widening the table
                    <th
                      key={column.key}
                      title={column.title}
                      className="min-w-[80px] align-bottom p-2 text-sm sm:text-base cursor-pointer hover:text-primary transition"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label} {sortConfig.key === column.key && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                  ))}
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {sortedMarkets.map(market => (
                  <tr
                    key={market.id}
                    className={`table-border hover:bg-muted/50 transition cursor-pointer ${promoMode ? '' : 'sm:cursor-default'}`}
                    onClick={() => {
                      if (promoMode) handlePromoClick(market);
                      else if (window.innerWidth < 640) handleLeverage(market);
                    }}
                  >
                    {COLUMNS.map(column => (
                      <td key={column.key} className={CELL_CLASS}>{column.render(market)}</td>
                    ))}
                    <td className={CELL_CLASS}>
                      <button
                        className="cta-button px-3 py-2 text-sm sm:text-base"
                        onClick={e => {
                          e.stopPropagation();
                          if (promoMode) handlePromoClick(market);
                          else handleLeverage(market);
                        }}
                      >
                        Leverage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2">
          Borrow a stablecoin against one of the Stables list and loop it. The max leverage is the theoretical max
          regarding the market&apos;s LTV.
        </p>
      </motion.div>

      {selectedMarket && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-container p-4 sm:p-6 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-xl sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <InfoCard
              title={<><span>Leverage</span><span className="font-bold">{selectedMarket.collateral.symbol}</span><span>on</span></>}
              image={getProjectImageSrc(selectedMarket.project)}
              imageAlt={selectedMarket.project}
              stats={[
                { label: 'Max net APY', value: `${formatPercent(selectedMarket.maxNetApy)} at ${formatLeverage(selectedMarket.maxLeverage)}` },
                { label: `${selectedMarket.collateral.symbol} APY`, value: formatPercent(selectedMarket.collateralApy) },
                { label: `${selectedMarket.debt.symbol} borrow APY`, value: formatBorrowApy(selectedMarket) },
                { label: 'Liquidity', value: smartShortNumber(selectedMarket.liquidity, 1, true, true) },
                ...(selectedMarket.utilization === undefined ? [] : [{ label: 'Utilisation', value: formatPercent(selectedMarket.utilization) }]),
              ]}
              message={`Open the market on ${selectedMarket.project} to pick your leverage. The max net APY is what the market's max LTV allows, one step away from liquidation.`}
            />

            <div className="flex gap-4 justify-end pt-3">
              <button
                onClick={closeModal}
                className="cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <a
                href={selectedMarket.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => gaEvent({ action: 'leverage_visit_project_click', params: { category: 'leverage', label: `${selectedMarket.project}-${selectedMarket.name}`, value: 0 } })}
                className="cta-button inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground"
              >
                View on {selectedMarket.project} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal image={preview} onClose={() => setPreview(null)} />

      {/* Off-screen screenshot template — rendered only during capture */}
      {screenshot && (
        <LeverageScreenshotView
          key={screenshotKey}
          ref={screenshotRef}
          rows={screenshot.rows}
          sortConfig={sortConfig}
          imageMap={screenshot.imageMap}
          highlightedId={screenshot.highlightedId}
        />
      )}
    </div>
  );
}
