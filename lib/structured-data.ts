import { FAQ_ITEMS } from './faq-content';

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Inverse Finance",
    url: "https://www.inverse.finance",
    logo: "https://www.inverse.finance/assets/inv-square-dark.jpeg",
    description:
      "Inverse Finance is a DeFi protocol building open financial infrastructure, including the DOLA stablecoin and FiRM fixed-rate lending.",
    sameAs: [
      "https://twitter.com/InverseFinance",
      "https://discord.gg/YpYJC7R5nv",
      "https://github.com/InverseFinance",
      "https://defillama.com/protocol/inverse-finance",
      "https://www.coingecko.com/en/coins/inverse-finance",
    ],
  };
}

export function buildDatasetJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Stablecoin Yield Comparison Table",
    description:
      "Live comparison of annual percentage yields (APY) across major yield-bearing stablecoins in DeFi, including sUSDe, sUSDS, sfrxUSD, scrvUSD, sDOLA, fxSAVE, and BOLD. Updated every 5 minutes with data from Ethereum on-chain contracts and DeFiLlama.",
    url: "https://www.stableyields.info/stable-yields",
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Inverse Finance",
      url: "https://www.inverse.finance",
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: "https://www.stableyields.info/stable-yields",
    },
    measurementTechnique:
      "On-chain data from Ethereum mainnet smart contracts combined with DeFiLlama yield APIs and CoinGecko price feeds",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "APY",
        description: "Current annual percentage yield",
      },
      {
        "@type": "PropertyValue",
        name: "30d Average APY",
        description: "Rolling 30-day average annual percentage yield",
      },
      {
        "@type": "PropertyValue",
        name: "90d Average APY",
        description: "Rolling 90-day average annual percentage yield",
      },
      {
        "@type": "PropertyValue",
        name: "TVL",
        description: "Total value locked in USD",
      },
    ],
  };
}

export function buildFaqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
