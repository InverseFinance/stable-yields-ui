// @ts-nocheck
"use client"

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Camera } from "lucide-react";
import { gaEvent, smartShortNumber } from "@/lib/utils";
import { TokenPrices } from "@/lib/fetchTokenPrices";
import { StakingCard } from '../StakingCard'
import { ScreenshotView, ScreenshotRowData, getProjectImageSrc } from '../ScreenshotView';
import { ASSET_CONTENT } from '@/lib/asset-content';

async function fetchAsDataUrl(src: string): Promise<string> {
  try {
    const res = await fetch(`/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`);
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

const projectImages = {
  'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
  'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
  'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
  'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
  'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
  'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Inverse': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Spark': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
  'Fluid': 'https://icons.llamao.fi/icons/protocols/fluid?w=48&h=48',
  'Sky': 'https://coin-images.coingecko.com/coins/images/39925/large/sky.jpg?1724827980',
} as const;

interface TableData {
  symbol?: string;
  project?: string;
  apy?: number;
  avg30d?: number;
  avg60d?: number;
  avg90d?: number;
  image?: string;
  borrowRate?: number;
  type?: string;
  hasLeverage?: boolean;
  borrowToken?: string;
  collateral?: string;
}

interface Column {
  key: string;
  label: string;
}

export default function FuturisticTable({
  timestamp,
  usTreasuryYield,
  data,
  columns,
  projectCollaterals,
  scrollableBody = true,
  tokenPrices,
  onDepositSuccess,
}: {
  timestamp: number;
  usTreasuryYield: number;
  data: TableData[];
  columns: Column[];
  projectCollaterals?: {
    [key: string]: string[];
  };
  scrollableBody?: boolean;
  tokenPrices: TokenPrices;
  onDepositSuccess?: () => void;
}) {
  const [sortConfig, setSortConfig] = useState<any>({ key: "apy", direction: "desc" });
  const [showModal, setShowModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<TableData | null>(null);
  const [screenshotData, setScreenshotData] = useState<{
    rows: ScreenshotRowData[];
    treasuryLineIndex: number;
    imageMap: Record<string, string>;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    highlightedSymbol?: string;
    highlightedProject?: string;
  } | null>(null);
  const [screenshotKey, setScreenshotKey] = useState(0);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [promoMode, setPromoMode] = useState(false);
  const [isButtonHidden, setIsButtonHidden] = useState(false);

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key] ?? 0;
    const bValue = b[sortConfig.key] ?? 0;
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const showTreasuryLine = sortConfig.key === 'apy' && usTreasuryYield > 0;
  let treasuryLineIndex = -1;
  if (showTreasuryLine) {
    if (sortConfig.direction === 'desc') {
      treasuryLineIndex = sortedData.findIndex(item => (item.apy ?? 0) < usTreasuryYield);
    } else {
      treasuryLineIndex = sortedData.findIndex(item => (item.apy ?? 0) >= usTreasuryYield);
    }
    if (treasuryLineIndex <= 0) treasuryLineIndex = -1;
  }

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCta = (item: TableData) => {
    gaEvent({ action: `supply-${item.project}-${item.symbol}`, params: { stable: item.symbol, project: item.project, key: `${item.symbol}_${item.project}`, apy: item.apy } });
    setPendingItem(item);
    setShowModal(true);
  };

  const handleDismiss = () => {
    setShowModal(false);
    setPendingItem(null);
  };

  // Captures the table as a PNG data URL, reusable for both screenshot and promo.
  const captureTableDataUrl = async (highlight?: { symbol: string; project: string }): Promise<string | null> => {
    const toRow = (item: any): ScreenshotRowData => ({
      symbol: item.symbol || '',
      project: item.project || '',
      projectLabel: item.projectLabel || item.project || '',
      apy: item.apy || 0,
      avg30: item.avg30 || 0,
      avg90: item.avg90 || 0,
      tvl: item.tvl || 0,
      image: item.image || '',
    });

    let displayItems: any[];
    let screenshotTreasuryIndex = -1;

    const isApySort = sortConfig.key === 'apy';
    if (isApySort && usTreasuryYield > 0) {
      const tIdx = sortConfig.direction === 'desc'
        ? sortedData.findIndex(item => (item.apy ?? 0) < usTreasuryYield)
        : sortedData.findIndex(item => (item.apy ?? 0) >= usTreasuryYield);
      if (tIdx > 0) {
        displayItems = sortedData.slice(0, tIdx + 1);
        screenshotTreasuryIndex = tIdx;
      } else {
        displayItems = sortedData;
      }
    } else {
      displayItems = sortedData.slice(0, 10);
    }

    const rows = displayItems.map(toRow);

    const rawSrcs = new Set<string>();
    for (const row of rows) {
      if (row.image) rawSrcs.add(row.image);
      rawSrcs.add(getProjectImageSrc(row.project));
    }
    const imageEntries = await Promise.all(
      Array.from(rawSrcs).map(async src => [src, await fetchAsDataUrl(src)] as const)
    );
    const imageMap: Record<string, string> = Object.fromEntries(
      imageEntries.filter(([, v]) => v)
    );

    flushSync(() => {
      setScreenshotKey(k => k + 1);
      setScreenshotData({
        rows,
        treasuryLineIndex: screenshotTreasuryIndex,
        imageMap,
        sortConfig,
        highlightedSymbol: highlight?.symbol,
        highlightedProject: highlight?.project,
      });
    });

    if (!screenshotRef.current) return null;

    try {
      const { toPng } = await import('html-to-image');
      const isDark = document.documentElement.classList.contains('dark');
      return await toPng(screenshotRef.current, {
        pixelRatio: 2,
        backgroundColor: isDark ? 'rgb(19,19,20)' : '#ffffff',
        style: { position: 'static', top: 'auto', left: 'auto', overflow: 'hidden' },
      });
    } finally {
      setScreenshotData(null);
    }
  };

  const handleScreenshot = async () => {
    const dataUrl = await captureTableDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = 'stable-yields.png';
    link.href = dataUrl;
    link.click();
  };

  const handlePromoClick = async (item: any, rank: number) => {
    setPromoMode(false);
    const tableDataUrl = await captureTableDataUrl({ symbol: item.symbol || '', project: item.project || '' });
    if (!tableDataUrl) return;

    const assetEntry = Object.values(ASSET_CONTENT).find(
      a => a.symbol.toLowerCase() === (item.symbol || '').toLowerCase()
    );
    const underlyingStable = assetEntry?.underlyingStable || '';
    const opportunityLink = item.link || assetEntry?.issuerUrl || '';

    const [tokenImageUrl, projectImageUrl] = await Promise.all([
      fetchAsDataUrl(item.image || ''),
      fetchAsDataUrl(getProjectImageSrc(item.project || '')),
    ]);

    const isDark = document.documentElement.classList.contains('dark');
    const { generatePromoImage } = await import('@/lib/generatePromoImage');
    const promoDataUrl = await generatePromoImage(tableDataUrl, {
      ...item,
      symbol: item.symbol || '',
      project: item.project || '',
      projectLabel: item.projectLabel || item.project || '',
      apy: item.apy || 0,
      avg30: item.avg30 || 0,
      avg90: item.avg90 || 0,
      tvl: item.tvl || 0,
      tokenImageUrl,
      projectImageUrl,
      link: opportunityLink,
      underlyingStable,
      underlyingSymbol: assetEntry?.underlyingStable || '',
      isVault: assetEntry?.mechanism?.toLowerCase().includes('erc-4626') ?? false,
      lockup: assetEntry?.lockup || '',
    }, rank, isDark);

    const a = document.createElement('a');
    a.download = `stable-yields-${(item.symbol || 'promo').toLowerCase()}.png`;
    a.href = promoDataUrl;
    a.click();
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showModal) handleDismiss();
        if (promoMode) setPromoMode(false);
        if (showCameraMenu) setShowCameraMenu(false);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [showModal, promoMode, showCameraMenu]);

  return (
    <div className="w-full">
      {promoMode && (
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-sm text-muted-foreground">Click on a yield opportunity to generate an image for it</p>
          <button
            onClick={() => setPromoMode(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer ml-4 shrink-0"
          >
            Cancel
          </button>
        </div>
      )}
      <motion.div
        className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          {/* Camera dropdown */}
          <div className="absolute -top-3 -right-2 z-20">
            <button
              onClick={() => isButtonHidden ? setIsButtonHidden(false) : setShowCameraMenu(v => !v)}
              style={{ opacity: isButtonHidden ? 0 : 1 }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs sm:text-sm transition cursor-pointer"
              title={isButtonHidden ? 'Show Screenshot button' : 'Screenshot options'}
            >
              <Camera size={14} />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
            {showCameraMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCameraMenu(false)} />
                <div className="absolute top-full right-0 mt-1 bg-container border border-border rounded-lg shadow-lg z-50 min-w-[190px] py-1 text-sm">
                  <button
                    className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                    onClick={() => { setShowCameraMenu(false); handleScreenshot(); }}
                  >
                    Screenshot the table
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                    onClick={() => { setShowCameraMenu(false); setPromoMode(true); }}
                  >
                    Highlight one stable
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                    onClick={() => { setShowCameraMenu(false); setIsButtonHidden(v => !v); }}
                  >
                    {isButtonHidden ? 'Show Screenshot button' : 'Hide Screenshot button'}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className={`${scrollableBody ? 'max-h-[60vh]' : ''} `}>
              <table className="w-full text-left text-foreground min-w-[800px]">
                <thead className="sticky top-0 backdrop-blur-lg z-10">
                  <tr className="text-muted-foreground">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="min-w-[125px] p-2 sm:p-3 text-sm sm:text-base lg:text-xl cursor-pointer hover:text-primary transition whitespace-nowrap"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label} {sortConfig.key === column.key && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, index) => {
                    const isTreasuryRow = showTreasuryLine && index === treasuryLineIndex;
                    const isRowBeforeTreasury = showTreasuryLine && index === treasuryLineIndex - 1;
                    return (
                      <motion.tr
                        key={index}
                        className={`${isRowBeforeTreasury ? '' : 'table-border'} hover:bg-muted/50 transition ${promoMode ? 'cursor-pointer' : 'sm:cursor-default cursor-pointer'}`}
                        style={isTreasuryRow ? { borderTop: '2px dashed oklch(0.554 0.046 257.417)' } : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          if (promoMode) {
                            const apySorted = [...data].sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));
                            const apyRank = apySorted.findIndex(d => d.symbol === item.symbol && d.project === item.project) + 1;
                            handlePromoClick(item, apyRank || index + 1);
                            return;
                          }
                          if (window.innerWidth < 640) handleCta(item);
                        }}
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            className={`min-w-[125px] p-2 sm:p-3 text-primary-foreground text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap ${item[column.key] === true || item[column.key] === 'fixed' ? 'text-green-400' : ''
                              } ${isTreasuryRow && colIndex === 0 ? 'relative overflow-visible' : ''}`}
                            key={column.key}
                          >
                            {isTreasuryRow && colIndex === 0 && (
                              <span className="absolute top-0 -translate-y-1/2 z-20 text-[12px] sm:text-sm font-semibold whitespace-nowrap backdrop-blur-xl shadow-lg bg-container px-3 rounded text-muted-foreground">
                                US Treasury Yield: <b>{usTreasuryYield.toFixed(2)}%</b>
                              </span>
                            )}
                            {
                              column.isCta ? (
                                <button className="cta-button text-sm sm:text-base" onClick={() => handleCta(item)}>
                                  {column.ctaText}
                                </button>
                              ) : column.key === 'project' ? (
                                <div className="flex items-center gap-2">
                                  <Image
                                    className="rounded-full w-5 h-5 sm:w-7 sm:h-7"
                                    src={projectImages[item["project"]] || `https://icons.llamao.fi/icons/protocols/${item["project"].toLowerCase().replace(/ /g, '-')}?w=48&h=48`}
                                    alt={item['project']}
                                    width={24}
                                    height={24}
                                  />
                                  <span className="text-sm sm:text-base lg:text-lg">{item["projectLabel"]}</span>
                                </div>
                              ) : ['symbol', 'borrowToken'].includes(column.key) ? (
                                <div className="flex items-center gap-2">
                                  <Image
                                    className="rounded-full w-5 h-5 sm:w-7 sm:h-7"
                                    src={item["image"]}
                                    alt={item['symbol']}
                                    width={24}
                                    height={24}
                                  />
                                  <span className="text-sm sm:text-base lg:text-lg">{item[column.key]}</span>
                                </div>
                              ) : typeof item[column.key] === 'number' ?
                                column.type === 'usd' ? `${smartShortNumber(item[column.key], 1, true, true)}` : `${item[column.key] ? (item[column.key]).toFixed(2) + '%' : '-'}` :
                                typeof item[column.key] === 'string' ?
                                  (item[column.key].replace('fixed', 'Fixed').replace('variable', 'Variable') || '-') :
                                  typeof item[column.key] === 'boolean' ?
                                    item[column.key] ? 'Yes' : 'No' :
                                    item[column.key] || '-'
                            }
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {timestamp && (
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">
            Last updated: {new Date(timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </p>
        )}
      </motion.div>

      <AnimatePresence>
        {(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
            onClick={handleDismiss}
            style={{ display: showModal ? 'flex' : 'none' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-container p-4 sm:p-6 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-xl sm:max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Earn with {pendingItem?.symbol}</h3> */}
              {/* <p className="text-sm sm:text-base text-muted-foreground mb-6">
                You are about to visit an external website. We are not affiliated with or responsible for the content on external sites and only provide a link for your convenience.
              </p> */}

              <div className="rounded-full">
                <StakingCard stakingData={pendingItem ? pendingItem : sortedData[0]} tokenPrices={tokenPrices} onSuccess={() => { handleDismiss(); onDepositSuccess?.(); }} />
              </div>

              <div className="flex gap-4 justify-end pt-3">
                <button
                  onClick={handleDismiss}
                  className="cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <a href={pendingItem?.link} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={() => gaEvent({ action: `continue-${pendingItem?.project}-${pendingItem?.symbol}`, params: { stable: pendingItem?.symbol, project: pendingItem?.project, key: `${pendingItem?.symbol}_${pendingItem?.project}`, apy: pendingItem?.apy } })}
                    className="cta-button cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground"
                  >
                    Visit official website
                  </button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen screenshot template — rendered only during capture */}
      {screenshotData && (
        <ScreenshotView
          key={screenshotKey}
          ref={screenshotRef}
          rows={screenshotData.rows}
          treasuryLineIndex={screenshotData.treasuryLineIndex}
          usTreasuryYield={usTreasuryYield}
          sortConfig={screenshotData.sortConfig}
          imageMap={screenshotData.imageMap}
          highlightedSymbol={screenshotData.highlightedSymbol}
          highlightedProject={screenshotData.highlightedProject}
        />
      )}
    </div>
  );
}
