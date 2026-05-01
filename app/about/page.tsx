import { Metadata } from "next";
import { ProseLayout } from "@/components/ProseLayout";

export const metadata: Metadata = {
  title: "About Stable Yields | Inverse Finance",
  description:
    "Stable Yields is a free stablecoin yield comparison tool built by Inverse Finance. Learn about our mission, data sources, and fee transparency.",
  alternates: {
    canonical: "https://www.stableyields.info/about",
  },
};

export default function AboutPage() {
  return (
    <ProseLayout title="About Stable Yields">
      <section>
        <h2>What is Stable Yields?</h2>
        <p>
          Stable Yields is a free, real-time comparison tool for yield-bearing
          stablecoins across decentralized finance (DeFi). It helps users find
          and compare the best stablecoin yields available on Ethereum, with
          transparent data sourced from on-chain smart contracts and
          industry-standard data providers like DeFiLlama and CoinGecko.
        </p>
        <p>
          Whether you&apos;re evaluating sDOLA, sUSDe, sUSDS, sfrxUSD, scrvUSD,
          or other yield-bearing stablecoins, Stable Yields provides the current
          APY, 30-day and 90-day moving averages, TVL, and historical charts you
          need to make informed decisions.
        </p>
      </section>

      <section>
        <h2>Built by Inverse Finance</h2>
        <p>
          Stable Yields is built and maintained by{" "}
          <a href="https://www.inverse.finance" target="_blank" rel="noopener noreferrer">
            Inverse Finance
          </a>
          , a decentralized autonomous organization (DAO) focused on building
          open financial infrastructure. Inverse Finance is the creator of:
        </p>
        <ul>
          <li>
            <strong>DOLA</strong>, a decentralized stablecoin used across DeFi.
          </li>
          <li>
            <strong>FiRM</strong>, a fixed-rate lending protocol where users
            can borrow DOLA against crypto collateral at predictable rates.
          </li>
          <li>
            <strong>sDOLA</strong>, a yield-bearing vault that distributes FiRM
            lending revenue to DOLA depositors.
          </li>
        </ul>
        <p>
          While Inverse Finance builds sDOLA, Stable Yields presents all
          yield-bearing stablecoins neutrally. The comparison table is sorted by
          APY by default and applies no bias toward any particular protocol.
        </p>
      </section>

      <section>
        <h2>Free to Use</h2>
        <p>
          Viewing and comparing stablecoin yields on Stable Yields is{" "}
          <strong>completely free</strong>. There is no account registration, no
          paywall, and no tracking beyond standard analytics. The data is
          refreshed every 5 minutes and is available to everyone.
        </p>
      </section>

      <section>
        <h2>Fee Transparency</h2>
        <p>
          If you choose to swap or deposit into a yield-bearing stablecoin
          through our interface, a <strong>0.1% routing fee</strong> (10 basis
          points) is applied via{" "}
          <a href="https://enso.finance" target="_blank" rel="noopener noreferrer">
            Enso Finance
          </a>
          , our swap aggregation partner. This fee is applied to the swap
          transaction and is the sole revenue source for the tool.
        </p>
        <p>
          You can always avoid this fee by depositing directly through each
          protocol&apos;s own interface, the links are provided for every asset in
          the yield table. Stable Yields prioritizes transparency: the fee is
          disclosed here and is visible in the swap confirmation before you sign
          any transaction.
        </p>
      </section>

      <section>
        <h2>Why We Built This</h2>
        <p>
          The DeFi ecosystem offers many yield-bearing stablecoins, each with
          different mechanisms, risk profiles, and APYs. Finding and comparing
          these options used to require visiting multiple protocol dashboards,
          DeFiLlama pages, and community forums.
        </p>
        <p>
          Stable Yields exists to solve this by putting all the information in
          one place: live APYs, historical trends, TVL, and links to deposit —
          all updated automatically. Our goal is to make yield comparison as
          simple as possible so users can focus on understanding risk and making
          informed decisions.
        </p>
      </section>

      <section>
        <h2>Connect With Us</h2>
        <ul>
          <li>
            <a href="https://www.inverse.finance" target="_blank" rel="noopener noreferrer">
              Inverse Finance
            </a>{" "}
            — Main website
          </li>
          <li>
            <a href="https://twitter.com/InverseFinance" target="_blank" rel="noopener noreferrer">
              Twitter / X
            </a>{" "}
            — Updates and announcements
          </li>
          <li>
            <a href="https://discord.gg/YpYJC7R5nv" target="_blank" rel="noopener noreferrer">
              Discord
            </a>{" "}
            — Community and support
          </li>
          <li>
            <a href="https://github.com/InverseFinance" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{" "}
            — Open source code
          </li>
        </ul>
      </section>
    </ProseLayout>
  );
}
