"use client"
import { forwardRef } from 'react';
import { smartShortNumber } from '@/lib/utils';

export const PROJECT_IMAGES: Record<string, string> = {
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
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  imageMap: Record<string, string>;
}

export const ScreenshotView = forwardRef<HTMLDivElement, Props>(
  ({ rows, treasuryLineIndex, usTreasuryYield, sortConfig, imageMap }, ref) => {
    return (
      <div
        ref={ref}
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1024px', zIndex: -1 }}
        className="bg-background"
      >
        {/* Header — mirrors StableYieldsPageContent */}
        <header className="flex-wrap items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-5xl sm:text-8xl font-bold text-primary mb-2">Stable Yields</h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
              Earn and compare the best stablecoin yields across major DeFi protocols
            </h2>
          </div>
        </header>

        {/* Table card — mirrors FuturisticTable */}
        <div className="mx-3 bg-container rounded-2xl p-2 sm:p-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-foreground min-w-[800px]">
              <thead>
                <tr className="text-muted-foreground">
                  {COLUMNS.map(col => (
                    <th key={col.key} className="min-w-[125px] p-2 sm:p-3 text-sm sm:text-base lg:text-xl whitespace-nowrap">
                      {col.label}{' '}
                      {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isTreasuryRow = treasuryLineIndex > 0 && i === treasuryLineIndex;
                  const isRowBeforeTreasury = treasuryLineIndex > 0 && i === treasuryLineIndex - 1;
                  return (
                    <tr
                      key={`${row.symbol}-${row.project}-${i}`}
                      className={isRowBeforeTreasury ? '' : 'table-border'}
                      style={isTreasuryRow ? { borderTop: '2px dashed oklch(0.554 0.046 257.417)' } : undefined}
                    >
                      {COLUMNS.map((col, colIdx) => (
                        <td
                          key={col.key}
                          className={`min-w-[125px] p-2 sm:p-3 text-primary-foreground text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap${isTreasuryRow && colIdx === 0 ? ' relative overflow-visible' : ''}`}
                        >
                          {isTreasuryRow && colIdx === 0 && usTreasuryYield > 0 && (
                            <span className="absolute top-0 -translate-y-1/2 z-20 text-[12px] sm:text-sm font-semibold whitespace-nowrap shadow-lg bg-container px-3 rounded text-muted-foreground">
                              US Treasury Yield: <b>{usTreasuryYield.toFixed(2)}%</b>
                            </span>
                          )}
                          {renderCell(row, col.key, imageMap)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 mx-3 pt-3 border-t border-border text-center text-muted-foreground text-sm pb-6">
          https://www.stableyields.info
        </div>
      </div>
    );
  }
);

ScreenshotView.displayName = 'ScreenshotView';
