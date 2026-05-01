export interface FaqItem {
  question: string;
  answer: string;
  slug: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    slug: "what-are-yield-bearing-stablecoins",
    question: "What are yield-bearing stablecoins?",
    answer: "Yield-bearing stablecoins are tokens pegged to a fiat currency (usually USD) that automatically accrue interest or rewards. When you hold them, their value grows over time relative to the underlying stablecoin. Examples include sUSDe (Ethena), sUSDS (Sky/Maker), sDOLA (Inverse Finance), scrvUSD (Curve), and sfrxUSD (Frax). Unlike traditional stablecoins that simply hold their peg, these tokens are backed by productive strategies, lending, staking, or protocol revenue, that generate yield passed on to holders.",
  },
  {
    slug: "highest-stablecoin-yields",
    question: "What are the highest stablecoin yields right now?",
    answer: "Stable Yields tracks real-time APYs across all major yield-bearing stablecoins in DeFi. The highest yields change frequently as market conditions shift. Visit our main yield comparison table at stableyields.info to see the current ranking sorted by APY, along with 30-day and 90-day moving averages that reveal which yields are consistently high versus temporarily spiking.",
  },
  {
    slug: "how-are-apys-calculated",
    question: "How are these APYs calculated?",
    answer: "APYs are sourced from a combination of on-chain Ethereum smart contract data and the DeFiLlama yields API. The current APY reflects the annualized rate based on recent vault performance. The 30-day and 90-day averages are rolling averages computed from daily DeFiLlama snapshots, which smooths out short-term volatility and gives a more reliable picture of sustained returns. See our Methodology page for full details.",
  },
  {
    slug: "sdola-vs-susds-vs-susde",
    question: "What's the difference between sDOLA, sUSDS, and sUSDe?",
    answer: "These three yield-bearing stablecoins earn yield through fundamentally different mechanisms. sDOLA (Inverse Finance) is an ERC-4626 vault where yield comes from decentralized DOLA borrowing demand on FiRM, Inverse's fixed-rate lending protocol. sUSDS (Sky/Maker) earns yield from the Sky Savings Rate, funded by Maker protocol revenue from lending and RWA (Real World Asset) investments. sUSDe (Ethena) generates yield through a delta-neutral strategy combining staked ETH rewards with perpetual futures funding rates. Each has a different risk profile: sDOLA depends on FiRM borrowing demand, sUSDS on Maker protocol health, and sUSDe on futures funding rates remaining positive.",
  },
  {
    slug: "is-stable-yields-free",
    question: "Is Stable Yields free to use?",
    answer: "Yes, viewing and comparing yields on Stable Yields is completely free with no account required. If you choose to swap or deposit into a yield-bearing stablecoin through our interface, a 0.1% routing fee is applied via Enso Finance, our swap aggregation partner. You can always deposit directly through the issuing protocol's own interface to avoid this fee.",
  },
  {
    slug: "risks-of-yield-bearing-stablecoins",
    question: "What risks do yield-bearing stablecoins have?",
    answer: "Key risks include: smart contract risk (bugs or exploits in the protocol's code), depeg risk (the underlying stablecoin losing its peg to USD), yield variability (APYs can fluctuate significantly and past performance is not guaranteed), protocol-specific risks (governance attacks, oracle failures, or liquidity crunches), and regulatory risk. Each stablecoin has its own unique risk profile depending on its backing mechanism and collateral structure. Higher yields typically indicate higher risk, compare the 90-day average APY to understand consistency.",
  },
  {
    slug: "how-often-is-data-updated",
    question: "How often is the yield data updated?",
    answer: "The yield comparison table is updated every 5 minutes (300 seconds) through server-side revalidation. Data is fetched from Ethereum on-chain smart contracts, DeFiLlama yield APIs, and CoinGecko price feeds. Historical chart data covers the most recent 90-day period and is updated with each page refresh. The US Treasury benchmark rate is also refreshed alongside the yield data.",
  },
  {
    slug: "what-is-tvl",
    question: "What does TVL mean in the yield table?",
    answer: "TVL stands for Total Value Locked. It represents the total USD value of assets deposited into a particular yield-bearing stablecoin's smart contract. A higher TVL generally indicates greater adoption and liquidity, which can mean lower withdrawal risk. However, higher TVL can also dilute yields since the same protocol revenue is shared among more depositors. TVL data is sourced from DeFiLlama and on-chain contract reads.",
  },
  {
    slug: "can-i-lose-money",
    question: "Can I lose money with yield-bearing stablecoins?",
    answer: "While yield-bearing stablecoins aim to preserve principal and generate returns, losses are possible. Smart contract exploits, depegging of the underlying stablecoin, or protocol insolvency could result in partial or total loss. The yield shown is a projection based on recent performance, not a guarantee. Always research the specific protocol's security audits, insurance coverage, and collateral structure before depositing significant amounts.",
  },
];
