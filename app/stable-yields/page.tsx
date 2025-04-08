import { YieldTable } from "@/components/yield-table";
import { YieldData } from "../types";

export const revalidate = 300;

export default async function YieldsPage() {
  const data = await fetch(`https://inverse.finance/api/dola/sdola-comparator?v=2`);
  const json = await data.json();
  const rates = json.rates.filter((r: YieldData) => !['sDAI'].includes(r.symbol));
  const chartResults = await Promise.allSettled(rates.map(async (r: YieldData) => {
    if (!r.pool) return [];
    const data = await fetch(`https://yields.llama.fi/chart/${r.pool}`);
    const chartResult = await data.json();
    return chartResult.status === 'success' ? chartResult.data : [];
  }));
  const ninetyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const topFiveApySymbols = rates.sort((a, b) => b.apy - a.apy).slice(0, 5).map((r) => r.symbol);
  const chartData = chartResults
    .filter((r, i) => topFiveApySymbols.includes(rates[i].symbol))
    .map((r, i) => {
      const cd = r.status === 'fulfilled' ? r.value?.filter((d: any) => d.timestamp >= ninetyDaysAgo) : [];
      return {
        symbol: rates[i].symbol,
        project: rates[i].project,
        chartData: cd.map(d => {
          return { ...d, ts: +(new Date(d.timestamp))}
        }),
      };
    });
  return (
    <>
      <header className="flex-wrap items-center justify-center py-12">
        {/* <AppNav activeItem="/stable-yields" /> */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-8xl lg:text-8xl font-bold text-primary mb-2">
            Stable Yields
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
            Compare stablecoin yields across major DeFi protocols
          </h2>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full items-center justify-center">
        <YieldTable
          chartData={chartData}
          data={rates.map((r: YieldData, index: number) => ({
            ...r,
            project: r.project.replace('FiRM', 'Inverse'),
          }))} timestamp={json.timestamp}
        />
      </div>
    </>
  );
}
