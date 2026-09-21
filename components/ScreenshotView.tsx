"use client"
import { CSSProperties, forwardRef, ReactNode } from 'react';
import { LpData } from '@/app/types';
import { smartShortNumber } from '@/lib/utils';

export const PROJECT_IMAGES: Record<string, string> = {
  'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
  'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
  'Convex': 'https://icons.llamao.fi/icons/protocols/convex-finance?w=48&h=48',
  'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
  'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
  'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
  'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Inverse': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Spark': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
  'Fluid': 'https://icons.llamao.fi/icons/protocols/fluid?w=48&h=48',
  'Sky': 'https://coin-images.coingecko.com/coins/images/39925/large/sky.jpg?1724827980',
};

export function getProjectImageSrc(project: string): string {
  return PROJECT_IMAGES[project]
    || `https://icons.llamao.fi/icons/protocols/${project.toLowerCase().replace(/ /g, '-')}?w=48&h=48`;
}

export interface ScreenshotRowData {
  symbol: string;
  project: string;
  projectLabel: string;
  apy: number;
  avg30: number;
  avg90: number;
  tvl: number;
  image: string;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' };

const CELL_CLASS = 'min-w-[125px] p-2 sm:p-3 text-primary-foreground text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap';
const HL_COLOR = 'rgba(16,208,122,0.65)';

// Outline of the highlighted row, drawn cell by cell
const getHighlightedCellStyle = (isFirst: boolean, isLast: boolean): CSSProperties => ({
  backgroundColor: 'rgba(16,208,122,0.08)',
  borderTop: `2px solid ${HL_COLOR}`,
  borderBottom: `2px solid ${HL_COLOR}`,
  ...(isFirst ? { borderLeft: `2px solid ${HL_COLOR}`, borderRadius: '8px 0 0 8px', paddingLeft: '10px' } : {}),
  ...(isLast  ? { borderRight: `2px solid ${HL_COLOR}`, borderRadius: '0 8px 8px 0' } : {}),
});

const HeaderCells = ({ columns, sortConfig }: { columns: { key: string; label: string }[]; sortConfig: SortConfig }) => (
  <tr className="text-muted-foreground">
    {columns.map(col => (
      <th key={col.key} className="min-w-[125px] p-2 sm:p-3 text-sm sm:text-base lg:text-xl whitespace-nowrap">
        {col.label}{' '}
        {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '▲' : '▼')}
      </th>
    ))}
  </tr>
);

// Off-screen page frame around a table, rendered only during capture
const ScreenshotFrame = forwardRef<HTMLDivElement, { children: ReactNode }>(({ children }, ref) => (
  <div
    ref={ref}
    style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1024px', zIndex: -1, overflow: 'hidden' }}
    className="bg-background"
  >
    {/* Hide all scrollbars inside the foreignObject context that html-to-image creates */}
    <style>{`* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`}</style>
    {/* Header — mirrors StableYieldsPageContent */}
    <header className="flex-wrap items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-5xl sm:text-8xl font-bold text-primary mb-2">Stable Yields</h1>
        <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
          Earn and compare the best stablecoin yields across major DeFi protocols
        </h2>
      </div>
    </header>

    {children}

    {/* Footer */}
    <div className="mt-4 text-xl mx-3 pt-3 border-t border-border text-center text-muted-foreground text-sm pb-6">
      https://www.stableyields.info
    </div>
  </div>
));

ScreenshotFrame.displayName = 'ScreenshotFrame';

const COLUMNS = [
  { key: 'symbol', label: 'Stablecoin' },
  { key: 'project', label: 'Project' },
  { key: 'apy',    label: 'APY' },
  { key: 'avg30',  label: '30d Avg.' },
  { key: 'avg90',  label: '90d Avg.' },
  { key: 'tvl',    label: 'TVL' },
];

function renderCell(row: ScreenshotRowData, key: string, imageMap: Record<string, string>) {
  if (key === 'symbol') {
    const src = imageMap[row.image] || row.image;
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rounded-full w-7 h-7 object-cover" src={src} alt={row.symbol} width={28} height={28} />
        <span>{row.symbol}</span>
      </div>
    );
  }
  if (key === 'project') {
    const rawSrc = getProjectImageSrc(row.project);
    const src = imageMap[rawSrc] || rawSrc;
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rounded-full w-7 h-7 object-cover" src={src} alt={row.project} width={28} height={28} />
        <span>{row.projectLabel || row.project}</span>
      </div>
    );
  }
  if (key === 'tvl') return smartShortNumber(row.tvl, 1, true, true);
  const num = row[key as keyof ScreenshotRowData] as number;
  return num ? `${num.toFixed(2)}%` : '-';
}

interface Props {
  rows: ScreenshotRowData[];
  /** Index of the first row below the US Treasury yield line, -1 if not applicable */
  treasuryLineIndex: number;
  usTreasuryYield: number;
  sortConfig: SortConfig;
  imageMap: Record<string, string>;
  highlightedSymbol?: string;
  highlightedProject?: string;
}

export const ScreenshotView = forwardRef<HTMLDivElement, Props>(
  ({ rows, treasuryLineIndex, usTreasuryYield, sortConfig, imageMap, highlightedSymbol, highlightedProject }, ref) => {
    return (
      <ScreenshotFrame ref={ref}>
        {/* Table card — mirrors FuturisticTable */}
        <div className="mx-3 bg-container rounded-2xl p-2 sm:p-4 shadow-xl">
          <div className="overflow-x-hidden">
            <table className="w-full text-left text-foreground min-w-[800px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <HeaderCells columns={COLUMNS} sortConfig={sortConfig} />
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isTreasuryRow = treasuryLineIndex > 0 && i === treasuryLineIndex;
                  const isRowBeforeTreasury = treasuryLineIndex > 0 && i === treasuryLineIndex - 1;
                  const isHighlighted = !!(highlightedSymbol && row.symbol === highlightedSymbol && row.project === highlightedProject);
                  return (
                    <tr
                      key={`${row.symbol}-${row.project}-${i}`}
                      className={isRowBeforeTreasury ? '' : 'table-border'}
                      style={isTreasuryRow ? { borderTop: '2px dashed oklch(0.554 0.046 257.417)' } : undefined}
                    >
                      {COLUMNS.map((col, colIdx) => {
                        const isFirst = colIdx === 0;
                        const isLast = colIdx === COLUMNS.length - 1;
                        return (
                          <td
                            key={col.key}
                            className={`${CELL_CLASS}${isTreasuryRow && isFirst ? ' relative overflow-visible' : ''}`}
                            style={isHighlighted ? getHighlightedCellStyle(isFirst, isLast) : undefined}
                          >
                            {isTreasuryRow && isFirst && usTreasuryYield > 0 && (
                              <span className="absolute top-0 -translate-y-1/2 z-20 text-[12px] sm:text-sm font-semibold whitespace-nowrap shadow-lg bg-container px-3 rounded text-muted-foreground">
                                US Treasury Yield: <b>{usTreasuryYield.toFixed(2)}%</b>
                              </span>
                            )}
                            {renderCell(row, col.key, imageMap)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ScreenshotFrame>
    );
  }
);

ScreenshotView.displayName = 'ScreenshotView';

const LP_COLUMNS = [
  { key: 'symbol', label: 'Pool' },
  { key: 'project', label: 'Project' },
  { key: 'totalApr', label: 'Total APR' },
  { key: 'tvl', label: 'TVL' },
];

export const getLpKey = (lp: LpData) => `${lp.project}-${lp.address}`;

// Icon from its preloaded data URL, or the label's first letter when it couldn't be loaded
function ScreenshotIcon({ src, label, imageMap, className = '' }: { src: string; label: string; imageMap: Record<string, string>; className?: string }) {
  const dataUrl = imageMap[src];
  if (!dataUrl) {
    return (
      <span className={`rounded-full w-7 h-7 shrink-0 bg-muted text-muted-foreground text-xs flex items-center justify-center ${className}`}>
        {label.slice(0, 1)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`rounded-full w-7 h-7 shrink-0 object-cover ${className}`} src={dataUrl} alt={label} width={28} height={28} />;
}

function renderLpCell(lp: LpData, key: string, imageMap: Record<string, string>) {
  if (key === 'symbol') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 shrink-0">
          {lp.coins.map(coin => (
            <ScreenshotIcon key={coin.address} src={coin.image} label={coin.symbol} imageMap={imageMap} className="ring-2 ring-card" />
          ))}
        </div>
        <span>{lp.symbol}</span>
      </div>
    );
  }
  if (key === 'project') {
    return (
      <div className="flex items-center gap-2">
        <ScreenshotIcon src={getProjectImageSrc(lp.project)} label={lp.project} imageMap={imageMap} />
        <span>{lp.project}</span>
      </div>
    );
  }
  if (key === 'tvl') return smartShortNumber(lp.tvl, 1, true, true);
  return lp.totalApr ? `${lp.totalApr.toFixed(2)}%` : '-';
}

export const LpsScreenshotView = forwardRef<HTMLDivElement, {
  rows: LpData[];
  sortConfig: SortConfig;
  imageMap: Record<string, string>;
  highlightedKey?: string;
}>(({ rows, sortConfig, imageMap, highlightedKey }, ref) => (
  <ScreenshotFrame ref={ref}>
    {/* Active tab — mirrors the tabs above the tables */}
    <div className="mx-3 mb-4 flex border-b border-border">
      <span className="relative px-4 py-2.5 text-lg font-semibold text-foreground">
        Stable Pairs
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
      </span>
    </div>
    {/* Table card — mirrors LpsTable */}
    <div className="mx-3 bg-container rounded-2xl p-2 sm:p-4 shadow-xl">
      <table className="w-full text-left text-foreground" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <HeaderCells columns={LP_COLUMNS} sortConfig={sortConfig} />
        </thead>
        <tbody>
          {rows.map(lp => {
            const isHighlighted = getLpKey(lp) === highlightedKey;
            return (
              <tr key={getLpKey(lp)} className="table-border">
                {LP_COLUMNS.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className={CELL_CLASS}
                    style={isHighlighted ? getHighlightedCellStyle(colIdx === 0, colIdx === LP_COLUMNS.length - 1) : undefined}
                  >
                    {renderLpCell(lp, col.key, imageMap)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </ScreenshotFrame>
));

LpsScreenshotView.displayName = 'LpsScreenshotView';
