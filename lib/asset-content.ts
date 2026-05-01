export interface AssetContent {
  slug: string;
  symbol: string;
  name: string;
  issuer: string;
  issuerUrl: string;
  underlyingStable: string;
  mechanism: string;
  chainSupport: string[];
  riskFactors: string[];
  redeemableVia: string[];
  sections: { heading: string; body: string }[];
  metaDescription: string;
  coingeckoId?: string;
  contractAddress?: string;
}

export const ASSET_CONTENT: Record<string, AssetContent> = {
  sdola: {
    slug: "sdola",
    symbol: "sDOLA",
    name: "Staked DOLA",
    issuer: "Inverse Finance",
    issuerUrl: "https://www.inverse.finance",
    underlyingStable: "DOLA",
    mechanism: "ERC-4626 tokenized vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk (FiRM protocol and sDOLA vault)",
      "DOLA depeg risk, DOLA is backed by a basket of collateral on FiRM",
      "Yield variability, returns depend on FiRM borrowing demand and utilization",
      "Concentration risk, yield is generated from a single protocol",
    ],
    redeemableVia: [
      "Direct redemption via the sDOLA contract on Ethereum",
      "Stable Yields interface (0.1% Enso routing fee)",
      "sDOLA Earn app (earn.inverse.finance)",
    ],
    sections: [
      {
        heading: "What is sDOLA?",
        body: "sDOLA is the yield-bearing version of DOLA, the decentralized stablecoin issued by Inverse Finance. It is implemented as an ERC-4626 tokenized vault on Ethereum mainnet. When you deposit DOLA into the sDOLA vault, you receive sDOLA shares whose value appreciates over time as lending revenue accrues from FiRM, Inverse Finance's fixed-rate lending protocol.",
      },
      {
        heading: "How does sDOLA generate yield?",
        body: "The yield comes from DOLA borrowing revenue generated on FiRM. Borrowers on FiRM pay fixed interest rates to borrow DOLA against collateral like WBTC, WETH, and other assets. This interest revenue flows into the sDOLA vault, increasing the exchange rate between sDOLA and DOLA over time. The APY varies based on FiRM's total borrowing demand and DBR's price, the tokenized borrowing credits. Unlike many DeFi yields that rely on token emissions, sDOLA's yield is organic, it comes from real lending revenue, via the automated sale of DBR tokens in a dutch autcion.",
      },
      {
        heading: "Who issues DOLA and sDOLA?",
        body: "DOLA is issued by Inverse Finance, a decentralized autonomous organization (DAO) governed by INV token holders. Inverse Finance has been operating since 2021 and is known for building FiRM, a fixed-rate lending market, and the DOLA Fed system that manages DOLA's supply across DeFi. The sDOLA vault contract is deployed on Ethereum mainnet and is governed by the Inverse Finance DAO.",
      },
      {
        heading: "Risk profile",
        body: "sDOLA's risk profile is moderate within the yield-bearing stablecoin landscape. The primary risk is smart contract risk in both the sDOLA vault and the underlying FiRM lending protocol. DOLA itself could depeg if FiRM borrowers' collateral values decline sharply, though FiRM uses Personal Collateral Escrows (PCEs) and a Debt-Based Liquidation system to mitigate this. Yield concentration risk is also present since all revenue comes from a single lending protocol. On the positive side, the mechanism is transparent and fully on-chain, with no reliance on centralized exchanges or off-chain assets.",
      },
      {
        heading: "Peg and redemption",
        body: "sDOLA is always redeemable for the underlying DOLA at the current exchange rate determined by the vault. There is no lock-up period, you can withdraw your DOLA at any time by redeeming your sDOLA shares. DOLA itself maintains its peg through the DOLA Fed system, which manages liquidity across Curve, Balancer, and other DEXs. DOLA has maintained a tight peg throughout its history, though minor deviations can occur during periods of high market volatility.",
      },
    ],
    metaDescription:
      "sDOLA is Inverse Finance's yield-bearing stablecoin vault. Deposit DOLA to earn variable yield from FiRM lending. Compare sDOLA APY, TVL, and risk profile.",
    contractAddress: "0xb45ad160634c528Cc3D2926d9807104FA3157305",
    coingeckoId: "sdola",
  },
  susde: {
    slug: "susde",
    symbol: "sUSDe",
    name: "Staked USDe",
    issuer: "Ethena Labs",
    issuerUrl: "https://ethena.fi",
    underlyingStable: "USDe",
    mechanism: "ERC-4626 staking vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Funding rate risk, perpetual futures funding can turn negative in bear markets",
      "Custodial risk, relies on centralized exchange infrastructure for the futures leg",
      "Smart contract risk in the USDe minting and sUSDe staking contracts",
      "USDe depeg risk if the delta-neutral strategy breaks down",
    ],
    redeemableVia: [
      "Ethena app (ethena.fi), 7-day unstaking cooldown",
      "Secondary market swaps on DEXs (instant, may have slippage)",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is sUSDe?",
        body: "sUSDe is the staked version of USDe, Ethena's synthetic dollar. When you stake USDe in the sUSDe contract, you earn yield generated by Ethena's delta-neutral strategy. sUSDe is an ERC-4626 vault token whose value increases relative to USDe over time as protocol revenue accrues. Since its launch in late 2023, sUSDe has become one of the highest-yielding stablecoin options in DeFi.",
      },
      {
        heading: "How does sUSDe generate yield?",
        body: "Ethena's yield comes from two sources combined in a delta-neutral strategy. First, staked ETH (like stETH) provides Ethereum staking rewards. Second, Ethena opens short ETH perpetual futures positions on centralized exchanges to hedge the ETH exposure, and these short positions typically earn positive funding rates, meaning traders who are long pay a fee to those who are short. The combination of staking yield plus funding rate income is passed to sUSDe holders. During periods of high bullish sentiment, funding rates spike and sUSDe yields can be exceptionally high. However, funding rates can turn negative during bearish conditions.",
      },
      {
        heading: "Who issues USDe and sUSDe?",
        body: "USDe is issued by Ethena Labs, a venture-backed company that launched in 2023. Ethena raised significant funding from top crypto VCs and has grown USDe to become one of the largest stablecoins by market cap. The protocol uses a centralized custodian model, assets are held at exchanges via off-exchange settlement providers like Copper and Ceffu, which allow Ethena to earn yield without directly exposing funds to exchange custody risk.",
      },
      {
        heading: "Risk profile",
        body: "sUSDe carries a unique risk profile that differs from traditional overcollateralized stablecoins. The primary risk is funding rate risk: if perpetual futures funding rates turn negative for extended periods, Ethena's reserve fund would need to cover the costs, and if depleted, yields could turn negative or USDe could face redemption pressure. Custodial risk is also significant, the strategy depends on centralized exchanges remaining solvent and operational. Smart contract risk exists but is partially mitigated by audits from multiple firms. The reliance on centralized infrastructure makes sUSDe fundamentally different from fully decentralized alternatives.",
      },
      {
        heading: "Peg and redemption",
        body: "USDe maintains its peg through arbitrage: authorized participants can mint USDe by depositing stETH and redeem USDe for the underlying collateral. The sUSDe contract has a 7-day unstaking cooldown period for withdrawals. For instant liquidity, sUSDe can be swapped on DEXs like Curve, though slippage may apply for large amounts. The peg has been stable since launch, though brief deviations have occurred during market stress events.",
      },
    ],
    metaDescription:
      "sUSDe is Ethena's yield-bearing staked dollar. Earn yield from delta-neutral ETH strategies. Compare sUSDe APY, risks, and how it works.",
    contractAddress: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
    coingeckoId: "ethena-staked-usde",
  },
  susds: {
    slug: "susds",
    symbol: "sUSDS",
    name: "Savings USDS",
    issuer: "Sky (formerly Maker)",
    issuerUrl: "https://sky.money",
    underlyingStable: "USDS",
    mechanism: "Savings rate vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk in the Sky/Maker protocol",
      "USDS depeg risk, though USDS (formerly DAI) has an excellent peg track record",
      "Yield variability, the Sky Savings Rate is set by governance",
      "Governance risk, rate changes depend on MKR/SKY token holder votes",
    ],
    redeemableVia: [
      "Sky app (sky.money), instant withdrawal",
      "Secondary market swaps on DEXs",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is sUSDS?",
        body: "sUSDS is the yield-bearing version of USDS (formerly DAI), issued by Sky (formerly MakerDAO). By depositing USDS into the Sky Savings Rate contract, you receive sUSDS tokens that automatically accrue yield. sUSDS is the successor to sDAI and is part of Sky's rebranded ecosystem. It represents one of the most battle-tested yield-bearing stablecoins in DeFi, backed by the oldest and most proven stablecoin protocol.",
      },
      {
        heading: "How does sUSDS generate yield?",
        body: "The yield comes from the Sky Savings Rate (SSR), which is funded by revenue generated across the entire Maker/Sky protocol. This includes interest from overcollateralized crypto loans (ETH, WBTC, and other collateral types), yield from Real World Assets (RWAs) including US Treasury bills, and revenue from PSM (Peg Stability Module) operations. The SSR is set by Sky governance through MKR/SKY token holder votes, and it represents the protocol's primary mechanism for managing USDS supply and demand.",
      },
      {
        heading: "Who issues USDS and sUSDS?",
        body: "USDS is issued by the Sky protocol (rebranded from MakerDAO in 2024). MakerDAO launched in 2017 and is one of the oldest and most established DeFi protocols. The protocol is governed by MKR/SKY token holders who vote on risk parameters, collateral types, and the savings rate. With billions in TVL and years of operation through multiple market cycles, Sky/Maker is widely considered the most battle-tested lending protocol in DeFi.",
      },
      {
        heading: "Risk profile",
        body: "sUSDS is generally considered one of the lower-risk yield-bearing stablecoins due to the maturity and scale of the underlying protocol. Risks include smart contract risk (though the contracts have been live for years with multiple audits), governance risk (the SSR can be changed by a vote), and collateral risk (if a significant portion of collateral were to fail simultaneously). The inclusion of RWAs introduces some centralization risk but also diversifies the revenue base. USDS/DAI has maintained an excellent peg history through major market events including the 2022 bear market.",
      },
      {
        heading: "Peg and redemption",
        body: "sUSDS can be redeemed for USDS at any time with no lock-up period or withdrawal cooldown. The exchange rate only goes up, reflecting accumulated yield. USDS maintains its peg through the PSM module, which allows 1:1 swaps between USDS and other approved stablecoins (like USDC). This mechanism has proven highly effective at maintaining peg stability. sUSDS is also widely liquid on DEXs for instant swaps.",
      },
    ],
    metaDescription:
      "sUSDS is Sky's (formerly Maker) yield-bearing savings token. Earn the Sky Savings Rate on USDS. Compare sUSDS APY, TVL, risk profile, and peg history.",
    contractAddress: "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD",
    coingeckoId: "susds",
  },
  sfrxusd: {
    slug: "sfrxusd",
    symbol: "sfrxUSD",
    name: "Staked Frax USD",
    issuer: "Frax Finance",
    issuerUrl: "https://frax.finance",
    underlyingStable: "frxUSD",
    mechanism: "ERC-4626 staking vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk across Frax's multi-contract system",
      "frxUSD depeg risk, frxUSD is backed by a mix of crypto and RWA collateral",
      "Yield variability based on Frax lending and AMO strategies",
      "Complexity risk, Frax uses multiple interconnected systems (AMOs, Fraxlend, etc.)",
    ],
    redeemableVia: [
      "Frax Finance app (frax.finance), instant unstaking",
      "Secondary market swaps on Curve and other DEXs",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is sfrxUSD?",
        body: "sfrxUSD is the yield-bearing version of frxUSD, Frax Finance's stablecoin. It is an ERC-4626 vault where depositing frxUSD earns yield from Frax's diversified revenue streams. sfrxUSD is the evolution of sfrxETH staking concepts applied to the stablecoin domain, offering holders automatic yield accrual without active management.",
      },
      {
        heading: "How does sfrxUSD generate yield?",
        body: "Yield for sfrxUSD comes from multiple sources within the Frax ecosystem. These include interest from Fraxlend (Frax's lending markets), revenue from Algorithmic Market Operations (AMOs) that deploy frxUSD across DeFi protocols for productive use, and income from Real World Asset strategies including US Treasury exposure. This diversified approach means yield is not dependent on any single source, potentially offering more stable returns over time.",
      },
      {
        heading: "Who issues frxUSD and sfrxUSD?",
        body: "frxUSD and sfrxUSD are issued by Frax Finance, one of the pioneer DeFi stablecoin protocols founded by Sam Kazemian. Frax has been operating since 2020 and has evolved from a partially algorithmic model to a fully collateralized stablecoin. The protocol is governed by veFXS (vote-escrowed FXS) token holders. Frax operates a complex ecosystem including Fraxlend, Fraxswap, Fraxferry (cross-chain bridge), and multiple AMO strategies.",
      },
      {
        heading: "Risk profile",
        body: "sfrxUSD has a moderate risk profile. The complexity of Frax's system, with multiple AMOs, lending markets, and cross-chain deployments, creates a larger attack surface compared to simpler vault designs. However, this complexity also provides diversification of yield sources. frxUSD's backing includes both crypto collateral and RWAs, providing a hybrid risk profile. Smart contract risk is present across multiple interconnected contracts. Frax has operated through multiple market cycles without major incidents, building a track record of resilience.",
      },
      {
        heading: "Peg and redemption",
        body: "sfrxUSD can be unstaked to frxUSD at any time through the Frax app with no cooldown period. frxUSD maintains its peg through a combination of collateral backing, AMO operations, and DEX liquidity (primarily on Curve). The transition from partially algorithmic to fully collateralized has strengthened peg stability. frxUSD is widely available on major DEXs for instant swaps.",
      },
    ],
    metaDescription:
      "sfrxUSD is Frax Finance's yield-bearing staked stablecoin. Earn yield from Fraxlend and AMO strategies. Compare sfrxUSD APY, risks, and how it works.",
    contractAddress: "0xcf62f905562626cfcdd2261162a51fd02fc9c5b6",
    coingeckoId: "staked-frax-usd",
  },
  scrvusd: {
    slug: "scrvusd",
    symbol: "scrvUSD",
    name: "Savings crvUSD",
    issuer: "Curve Finance",
    issuerUrl: "https://curve.fi",
    underlyingStable: "crvUSD",
    mechanism: "ERC-4626 savings vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk in the Curve/crvUSD lending system",
      "crvUSD depeg risk, crvUSD is backed by crypto collateral with LLAMMA soft-liquidation",
      "Yield variability based on crvUSD borrowing demand",
      "Novel liquidation mechanism (LLAMMA) is relatively untested compared to traditional liquidation",
    ],
    redeemableVia: [
      "Curve Finance app (curve.fi), instant withdrawal",
      "Secondary market swaps on Curve pools",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is scrvUSD?",
        body: "scrvUSD is the savings version of crvUSD, Curve Finance's native stablecoin. By depositing crvUSD into the scrvUSD vault, holders earn yield generated by Curve's lending markets. scrvUSD is an ERC-4626 vault token, making it composable with other DeFi protocols. It represents the simplest way to earn yield on crvUSD holdings.",
      },
      {
        heading: "How does scrvUSD generate yield?",
        body: "The yield comes from interest paid by borrowers who mint crvUSD using crypto collateral on Curve's lending platform. Curve uses a novel mechanism called LLAMMA (Lending-Liquidating AMM Algorithm) that gradually converts collateral as prices decline rather than performing sudden liquidations. Interest rates are determined algorithmically based on utilization. Revenue from borrowing interest flows into the scrvUSD vault, increasing the exchange rate over time.",
      },
      {
        heading: "Who issues crvUSD and scrvUSD?",
        body: "crvUSD is issued by Curve Finance, one of the foundational DeFi protocols specializing in stablecoin and pegged asset trading. Curve launched in 2020 and operates the largest stablecoin DEX by volume. The protocol is governed by veCRV (vote-escrowed CRV) token holders. crvUSD launched in 2023 and uses Curve's deep expertise in stablecoin mechanics and AMM design to offer a differentiated lending product.",
      },
      {
        heading: "Risk profile",
        body: "scrvUSD has a moderate risk profile with some unique characteristics. The LLAMMA soft-liquidation mechanism is innovative but relatively newer compared to traditional liquidation models used by Aave or Maker. This means the risk model has less historical data to validate it through extreme market conditions. However, crvUSD has successfully navigated several market downturns since launch. Smart contract risk is present but mitigated by extensive auditing and Curve's established track record. The yield is organic, coming from genuine borrowing demand rather than token emissions.",
      },
      {
        heading: "Peg and redemption",
        body: "scrvUSD can be redeemed for crvUSD at any time with no lock-up period. The exchange rate only increases over time. crvUSD maintains its peg through PegKeeper contracts that automatically mint or burn crvUSD in Curve pools to stabilize the price, combined with arbitrage incentives. crvUSD is deeply liquid on Curve's own pools, making large swaps efficient with minimal slippage.",
      },
    ],
    metaDescription:
      "scrvUSD is Curve Finance's yield-bearing savings vault for crvUSD. Earn yield from crvUSD lending markets. Compare scrvUSD APY, TVL, and risk profile.",
    contractAddress: "0x0655977feb2f289a4ab78af67bab0d17aab84367",
    coingeckoId: "savings-crvusd",
  },
  fxsave: {
    slug: "fxsave",
    symbol: "fxSAVE",
    name: "f(x) Protocol Savings",
    issuer: "f(x) Protocol",
    issuerUrl: "https://fx.aladdin.club",
    underlyingStable: "fxUSD",
    mechanism: "Savings vault",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk in the f(x) Protocol system",
      "fxUSD depeg risk, relies on the f(x) Protocol's stability mechanism",
      "Newer protocol with less battle-testing than established alternatives",
      "Yield depends on the f(x) Protocol's leveraged staking demand",
    ],
    redeemableVia: [
      "f(x) Protocol app (fx.aladdin.club)",
      "Secondary market swaps on DEXs",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is fxSAVE?",
        body: "fxSAVE is the savings vault offered by f(x) Protocol, allowing users to earn yield on their stablecoin deposits. f(x) Protocol splits ETH-based assets into a stablecoin component (fxUSD) and a leveraged component (xETH), and fxSAVE captures a portion of the protocol's revenue for stablecoin depositors.",
      },
      {
        heading: "How does fxSAVE generate yield?",
        body: "The yield comes from f(x) Protocol's unique mechanism of splitting liquid staking derivatives (like stETH) into stable and leveraged components. Leverage seekers pay stability fees that are partially distributed to fxSAVE depositors. Additional revenue comes from rebalancing operations and protocol fees. The yield varies based on demand for leveraged ETH exposure within the f(x) Protocol ecosystem.",
      },
      {
        heading: "Who issues fxSAVE?",
        body: "fxSAVE is created by the f(x) Protocol team, which builds on top of Aladdin DAO's infrastructure. The protocol offers a novel approach to creating stable assets by splitting the volatility of ETH staking derivatives. f(x) Protocol launched its savings product to provide competitive yields for users who want stablecoin exposure without taking on leveraged risk.",
      },
      {
        heading: "Risk profile",
        body: "fxSAVE carries higher risk compared to more established yield-bearing stablecoins, primarily because f(x) Protocol is a newer and more complex system. The stability of fxUSD depends on adequate demand for the leveraged xETH component, if demand for leverage dries up, it could stress the protocol's ability to maintain fxUSD stability. Smart contract risk is elevated due to the complexity of the splitting mechanism. However, the protocol has been audited and has operated without major incidents since launch.",
      },
      {
        heading: "Peg and redemption",
        body: "fxSAVE deposits can be withdrawn through the f(x) Protocol interface. fxUSD maintains its peg through arbitrage opportunities between the stable and leveraged components of the protocol. Liquidity is available on decentralized exchanges, though it may be thinner than larger stablecoins. Users should verify current liquidity conditions before making large deposits or withdrawals.",
      },
    ],
    metaDescription:
      "fxSAVE is f(x) Protocol's yield-bearing savings vault. Earn yield from leveraged ETH demand. Compare fxSAVE APY, risk profile, and mechanism.",
  },
  ybold: {
    slug: "ybold",
    symbol: "BOLD",
    name: "BOLD Stablecoin",
    issuer: "Liquity",
    issuerUrl: "https://www.liquity.org",
    underlyingStable: "BOLD",
    mechanism: "Stability Pool yield",
    chainSupport: ["Ethereum Mainnet"],
    riskFactors: [
      "Smart contract risk in Liquity V2 contracts",
      "BOLD depeg risk, new stablecoin with limited track record",
      "Yield from stability pool can be volatile based on liquidation activity",
      "Liquity V2 is a newer protocol iteration with less battle-testing",
    ],
    redeemableVia: [
      "Liquity V2 interface",
      "Secondary market swaps on DEXs",
      "Stable Yields interface (0.1% Enso routing fee)",
    ],
    sections: [
      {
        heading: "What is BOLD?",
        body: "BOLD is the stablecoin of Liquity V2, the next generation of the Liquity protocol. Unlike its predecessor LUSD, BOLD introduces user-set interest rates and multi-collateral support. BOLD can be earned through stability pool deposits, where depositors receive a share of borrower interest payments and liquidation gains. BOLD represents Liquity's evolution toward a more capital-efficient and flexible stablecoin system.",
      },
      {
        heading: "How does BOLD generate yield?",
        body: "BOLD yield comes from two primary sources. First, borrowers who mint BOLD against their collateral (ETH, wstETH, etc.) pay user-set interest rates, these interest payments flow to stability pool depositors. Second, when borrower positions are liquidated, stability pool depositors receive discounted collateral in exchange for their BOLD. The combination of steady interest income and occasional liquidation gains creates the yield for BOLD depositors. This is a battle-tested mechanism inherited from Liquity V1 (which used LUSD).",
      },
      {
        heading: "Who issues BOLD?",
        body: "BOLD is issued by Liquity, a decentralized borrowing protocol originally launched in 2021. Liquity V1 (with LUSD) pioneered the immutable, governance-free lending protocol model. Liquity V2 introduces improvements including user-set interest rates, multi-collateral support, and enhanced capital efficiency while maintaining the protocol's ethos of minimized governance. The protocol is backed by multiple audits and has processed billions in loans since V1's launch.",
      },
      {
        heading: "Risk profile",
        body: "BOLD's risk profile combines the proven stability pool mechanism from Liquity V1 with the newer V2 architecture. The stability pool model has been battle-tested through multiple market cycles with LUSD, providing confidence in the mechanism. However, BOLD and Liquity V2 are newer, so the specific implementation has less track record. Risks include smart contract risk in the V2 contracts, collateral risk (price drops in ETH/wstETH could trigger cascading liquidations), and the possibility that interest income and liquidation gains may vary significantly over time. The protocol's governance-minimized design reduces governance attack risk but also limits the ability to adjust parameters in response to changing conditions.",
      },
      {
        heading: "Peg and redemption",
        body: "BOLD maintains its peg through Liquity's redemption mechanism, anyone can redeem BOLD for the underlying collateral at face value, creating a hard price floor. This mechanism is inherited from Liquity V1 where LUSD maintained an excellent peg track record. Stability pool deposits can be withdrawn at any time with no lock-up period. BOLD liquidity is available on decentralized exchanges, with Liquity V2 launching with integrations across major DeFi protocols.",
      },
    ],
    metaDescription:
      "BOLD is Liquity V2's stablecoin. Earn yield from stability pool interest and liquidation gains. Compare BOLD APY, risk profile, and peg mechanism.",
    contractAddress: "0x6440f144b7e50D6a8439336510312d2F54beB01D",
    coingeckoId: "liquity-bold-2",
  },
};

export const ASSET_SLUGS = Object.keys(ASSET_CONTENT);
