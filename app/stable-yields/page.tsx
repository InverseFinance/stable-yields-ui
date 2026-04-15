import { YieldTable } from "@/components/yield-table";
import { StakingData } from "../types";
import { fetchTokenPrices } from "@/lib/fetchTokenPrices";

export const revalidate = 300;

export default async function YieldsPage() {
  const [stablesRes, usTreasuryRes, tokenPricesRes] = await Promise.allSettled([
    fetch(`https://inverse.finance/api/dola/sdola-comparator?v=2`),
    fetch(`https://moneymatter.me/api/treasury/interest-rates`),
    fetchTokenPrices(),
  ])
  const json = stablesRes.status === 'fulfilled' ? await stablesRes.value.json() : { rates: [] };
  const tokenPrices = tokenPricesRes.status === 'fulfilled' ? tokenPricesRes.value : {};

  const usTreasuryData = usTreasuryRes.status === 'fulfilled' ? await usTreasuryRes.value.json() : { data: [] };
  const usTreasuryYield = usTreasuryData?.data?.length > 0 ? usTreasuryData.data[usTreasuryData.data.length - 1]?.BC_1MONTH : 0;
  // const data = await fetch(`http://localhost:3000/api/dola/sdola-comparator?v=2`);
  const rates = json.rates.filter((r: StakingData) => !['sDAI'].includes(r.symbol));
  const chartResults = await Promise.allSettled(rates.map(async (r: StakingData) => {
    if (!r.pool) return [];
    const data = await fetch(`https://yields.llama.fi/chart/${r.pool}`);
    const chartResult = await data.json();
    return chartResult.status === 'success' ? chartResult.data : [];
  }));

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const topFiveApySymbols = rates.sort((a, b) => b.apy - a.apy).filter(r => !!r.pool).slice(0, 5).map((r) => r.symbol);
  const chartData = chartResults
    .map((r, i) => {
      const cd = r.status === 'fulfilled' ? r.value?.filter((d: any) => d.timestamp >= ninetyDaysAgo) : [];
      // tolerate 5 day missing
      if (cd.length >= 85) {
        rates[i].tvlGrowth90 = (cd[cd.length - 1].tvlUsd - cd[0].tvlUsd) / cd[0].tvlUsd * 100;
      } else if (rates[i].totalAssets90d && rates[i].totalAssets) {
        rates[i].tvlGrowth90 = (rates[i].totalAssets90d - rates[i].totalAssets) / rates[i].totalAssets * 100;
      }
      return {
        symbol: rates[i].symbol,
        project: rates[i].project,
        chartData: cd.map(d => {
          const day = d.timestamp.substring(0, 10);
          return { ...d, day, ts: +(new Date(day)) }
        }),
      };
    })
    .filter((r, i) => topFiveApySymbols.includes(rates[i].symbol))
  return (
    <>
      <header className="flex-wrap items-center justify-center py-12">
        {/* <AppNav activeItem="/stable-yields" /> */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-8xl lg:text-8xl font-bold text-primary mb-2">
            Stable Yields
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
            Earn and compare the best stablecoin yields across major DeFi protocols
          </h2>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full items-center justify-center">
        <YieldTable
          tokenPrices={tokenPrices}
          usTreasuryYield={usTreasuryYield}
          chartData={chartData}
          data={rates.map((r: StakingData, index: number) => ({
            ...r,
            project: r.project.replace('FiRM', 'Inverse').replace(/fx-protocol/, '(fx) Protocol'),
            projectLabel: r.project.replace('FiRM', 'Inverse').replace(/fx-protocol/ig, 'f(x) Protocol'),
            symbol: r.symbol.replace('fxSave', 'fxSAVE'),
          }))} timestamp={json.timestamp}
        />
      </div>
    </>
  );
}
