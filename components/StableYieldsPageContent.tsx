import { YieldTable, type TabKey } from "@/components/yield-table";
import { StakingData } from "@/app/types";
import { fetchTokenPrices } from "@/lib/fetchTokenPrices";
import { fetchCurveLps } from "@/lib/curve-lps";
import { fetchConvexLps } from "@/lib/convex-lps";
import { fetchStakeDaoLps } from "@/lib/stakedao-lps";
import { fetchYearnLps } from "@/lib/yearn-lps";
import { fetchUsTreasuryYield } from "@/lib/treasury";
import { fetchLlamalendMarkets } from "@/lib/llamalend";
import { fetchMorphoMarkets } from "@/lib/morpho";
import { fetchFirmMarkets } from "@/lib/firm";

export async function StableYieldsPageContent({ title, titleSize = 'text-5xl sm:text-8xl lg:text-8xl', tab = 'stables' }: { title: string, titleSize?: string, tab?: TabKey }) {
  // doesn't reject, and isn't needed by the other requests, so it runs alongside all of them
  const usTreasuryYieldPromise = fetchUsTreasuryYield();
  const [stablesRes, tokenPricesRes] = await Promise.allSettled([
    fetch(`https://www.inverse.finance/api/dola/sdola-comparator?v=2`),
    fetchTokenPrices(),
  ])
  const json = stablesRes.status === 'fulfilled' ? await stablesRes.value.json() : { rates: [] };
  const tokenPrices = tokenPricesRes.status === 'fulfilled' ? tokenPricesRes.value : {};

  const rates = json.rates.filter((r: StakingData) => !['sDAI'].includes(r.symbol));
  const [chartResults, curveLps, convexLps, stakeDaoLps, yearnLps, llamalendMarkets, morphoMarkets, firmMarkets, usTreasuryYield] = await Promise.all([
    Promise.allSettled(rates.map(async (r: StakingData) => {
      if (!r.pool) return [];
      const data = await fetch(`https://yields.llama.fi/chart/${r.pool}`);
      const chartResult = await data.json();
      return chartResult.status === 'success' ? chartResult.data : [];
    })),
    fetchCurveLps(rates),
    fetchConvexLps(rates),
    fetchStakeDaoLps(rates),
    fetchYearnLps(rates),
    fetchLlamalendMarkets(rates),
    fetchMorphoMarkets(rates),
    fetchFirmMarkets(rates),
    usTreasuryYieldPromise,
  ]);

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
        <div className="text-center">
          <h1 className={`${titleSize}  font-bold text-primary mb-2`}>
            {title}
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
            Earn and compare the best stablecoin yields across major DeFi protocols
          </h2>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full items-center justify-center">
        <YieldTable
          initialTab={tab}
          tokenPrices={tokenPrices}
          usTreasuryYield={usTreasuryYield}
          chartData={chartData}
          lps={[...curveLps, ...convexLps, ...stakeDaoLps, ...yearnLps]}
          leverage={[...llamalendMarkets, ...morphoMarkets, ...firmMarkets]}
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
