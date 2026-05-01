import { Metadata } from "next";
import { ProseLayout } from "@/components/ProseLayout";

export const metadata: Metadata = {
  title: "Methodology - How APYs Are Calculated | Stable Yields",
  description:
    "How Stable Yields sources APY data from DeFiLlama and on-chain Ethereum contracts. Learn about update frequency, averaging methods, and what's included.",
  alternates: {
    canonical: "https://www.stableyields.info/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <ProseLayout
      title="Methodology"
      subtitle="How we source, calculate, and display stablecoin yield data"
    >
      <section>
        <h2>Data Sources</h2>
        <p>
          Stable Yields aggregates data from multiple sources to provide
          accurate, real-time yield comparisons for yield-bearing stablecoins:
        </p>
        <ul>
          <li>
            <strong>Inverse Finance API</strong>, The primary data feed
            (inverse.finance/api/dola/sdola-comparator) based on onchain calculations provides current APY,
            30-day and 90-day average APYs, TVL, and pool metadata for all
            tracked yield-bearing stablecoins. This API aggregates data from
            on-chain Ethereum smart contracts where the APYs are calculated by looking at the vault exchange rates between now and a historical date, meaning APYs are based on actual historical yield and extrapolated.
          </li>
          <li>
            <strong>DeFiLlama Yields API</strong>, Historical APY and TVL data
            is fetched from the DeFiLlama yields API (yields.llama.fi/chart) for
            each tracked pool. DeFiLlama is the industry-standard TVL and yield
            aggregator, sourcing data directly from protocol smart contracts.
          </li>
          <li>
            <strong>CoinGecko Price Feeds</strong>, Token prices in USD are
            fetched from CoinGecko&apos;s API to enable accurate deposit value
            calculations and cross-token comparisons.
          </li>
          <li>
            <strong>US Treasury Rates</strong>, The 1-month US Treasury bill
            yield is fetched and displayed as a risk-free rate benchmark, helping
            users evaluate whether DeFi yields adequately compensate for the
            additional risk.
          </li>
        </ul>
      </section>

      <section>
        <h2>Update Frequency</h2>
        <p>
          The yield comparison table uses server-side rendering with Incremental
          Static Regeneration (ISR). Data is revalidated every{" "}
          <strong>5 minutes</strong> (300 seconds). This means:
        </p>
        <ul>
          <li>APY, TVL, and price data are at most 5 minutes stale.</li>
          <li>
            The page loads instantly from cache, no waiting for API calls.
          </li>
          <li>
            Background revalidation ensures the next visitor always sees fresh
            data.
          </li>
        </ul>
      </section>

      <section>
        <h2>APY Calculation</h2>
        <p>
          <strong>Current APY</strong> is the annualized rate based on the most
          recent vault performance or protocol-reported rate. For ERC-4626 vaults
          (sDOLA, sUSDe, sUSDS, sfrxUSD, scrvUSD), this is derived from the
          change in the vault&apos;s share price over recent periods, annualized
          to a yearly rate.
        </p>
        <p>
          APY (Annual Percentage Yield) accounts for compounding, it represents
          the effective annual return if yields were continuously reinvested. This
          is different from APR (Annual Percentage Rate), which does not account
          for compounding.
        </p>
      </section>

      <section>
        <h2>30-Day and 90-Day Averages</h2>
        <p>
          The 30-day and 90-day average APYs are rolling averages computed from
          daily DeFiLlama yield snapshots. These averages serve an important
          purpose:
        </p>
        <ul>
          <li>
            <strong>Smoothing volatility</strong>, Daily APYs can swing
            dramatically based on short-term market conditions. Averages reveal
            the sustained yield level.
          </li>
          <li>
            <strong>Trend identification</strong>, Comparing the current APY to
            the 30d and 90d averages shows whether yields are trending up or
            down.
          </li>
          <li>
            <strong>Consistency assessment</strong>, A stablecoin where the
            current APY closely matches its 90d average is likely more
            predictable than one with large deviations.
          </li>
        </ul>
        <p>
          The averages require a minimum of 85 daily data points out of the
          expected 90 days to be considered valid, allowing tolerance for
          occasional missing data without displaying misleading results.
        </p>
      </section>

      <section>
        <h2>TVL (Total Value Locked)</h2>
        <p>
          TVL represents the total USD value of assets deposited into each
          yield-bearing stablecoin&apos;s smart contract. TVL data is sourced
          from DeFiLlama and supplemented with on-chain{" "}
          <code>totalAssets</code> reads where available.
        </p>
        <p>
          TVL growth over 90 days is also calculated to show whether a product
          is attracting or losing capital. This is computed from the earliest and
          latest DeFiLlama data points within the 90-day window.
        </p>
      </section>

      <section>
        <h2>What&apos;s Included</h2>
        <p>Stable Yields tracks yield-bearing stablecoins that meet these criteria:</p>
        <ul>
          <li>
            Available on Ethereum mainnet.
          </li>
          <li>
            Yield is generated organically (from lending, staking, or protocol
            revenue), not from token emission incentives.
          </li>
          <li>
            The token is a stablecoin or yield-bearing wrapper of a stablecoin
            (pegged or soft-pegged to USD).
          </li>
          <li>
            The asset has a DeFiLlama pool listing for verifiable yield data.
          </li>
        </ul>
      </section>

      <section>
        <h2>What&apos;s Excluded</h2>
        <p>The following are intentionally excluded from the comparison table:</p>
        <ul>
          <li>
            <strong>LP tokens</strong>, Liquidity provider positions with
            impermanent loss risk are not comparable to single-asset yield
            products.
          </li>
          <li>
            <strong>Leveraged positions</strong>, Strategies that involve
            borrowing to amplify yield are excluded due to liquidation risk.
          </li>
          <li>
            <strong>Incentivized-only yields</strong>, Products where the yield
            comes entirely from token emissions (farming rewards) rather than
            organic protocol revenue.
          </li>
          <li>
            <strong>Non-USD stablecoins</strong>, EUR, GBP, or other fiat
            pegged stablecoins are not currently tracked.
          </li>
        </ul>
      </section>

      <section>
        <h2>Historical Charts</h2>
        <p>
          The 90-day APY and TVL charts display data for the top 5
          yield-bearing stablecoins by current APY. Chart data is sourced from
          the DeFiLlama yields API, which provides daily snapshots of APY and
          TVL for each tracked pool. This historical view helps users identify
          trends, seasonal patterns, and the consistency of yields over time.
        </p>
      </section>

      <section>
        <h2>US Treasury Benchmark</h2>
        <p>
          The yield table includes a US Treasury 1-month bill rate as a dashed
          reference line. This serves as a risk-free rate benchmark, any DeFi
          stablecoin yield should ideally exceed this rate to compensate for the
          additional smart contract, depeg, and protocol risks involved. Treasury
          rate data is sourced from public US government APIs.
        </p>
      </section>
    </ProseLayout>
  );
}
