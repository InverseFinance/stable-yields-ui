import { LeverageData, StakingData } from '@/app/types';
import { getCollateralRates, getMaxLeverage, getNetApy, isWorthLeveraging, MIN_MARKET_ASSETS_USD } from '@/lib/leverage';
import { getEthenaMultiplier } from '@/lib/ethena-points';
import { fetchJson, getMainListCoins, toLpCoins } from '@/lib/lps';

const MORPHO_MARKETS_API = 'https://app.morpho.org/api/markets';
const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
// the dollar stablecoins we take as debt, Morpho markets borrow all sorts of assets
const DEBT_ADDRESSES = new Set([
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x6c3ea9036406852006290770bedfcaba0e23a0e8', // PYUSD
  '0xdc035d45d973e3ec169d2276ddab16f1e407384f', // USDS
]);

interface MorphoApiAsset {
  address: string;
  symbol: string;
  decimals: number;
  priceUsd: number | null;
}

interface MorphoApiMarket {
  uniqueKey: string;
  collateralAsset: MorphoApiAsset | null;
  loanAsset: MorphoApiAsset;
  // liquidation LTV, as a ratio
  lltv: number;
  // supplied to the market, in USD
  sizeUsd: number;
  liquidityAssetsUsd: number;
  // borrowed share of the market, as a ratio
  utilization: number;
  // rate paid on the debt, as a ratio
  borrowApy: number;
}

export const getMorphoMarketUrl = (uniqueKey: string) => `https://app.morpho.org/ethereum/market/${uniqueKey}`;

// Morpho markets borrowing a dollar stablecoin against a stablecoin of the main list
export async function fetchMorphoMarkets(rates: StakingData[]): Promise<LeverageData[]> {
  try {
    const collateralRates = getCollateralRates(rates);
    if (!collateralRates.size) return [];
    const mainListCoins = getMainListCoins(rates);
    // the API takes the collaterals as a comma separated list of chainId:address
    const collateralIds = [...collateralRates.keys()].map(address => `1:${address}`).join(',');
    const { items } = await fetchJson<{ items: MorphoApiMarket[] }>(
      `${MORPHO_MARKETS_API}?first=100&skip=0&orderBy=borrowAssetsUsd&orderDirection=DESC&chainIds=1&collateralAssetIds=${encodeURIComponent(collateralIds)}`,
    );

    return (items || []).flatMap(market => {
      const { collateralAsset, loanAsset } = market;
      const rate = collateralAsset && collateralRates.get(collateralAsset.address.toLowerCase());
      if (!rate || !collateralAsset || market.sizeUsd < MIN_MARKET_ASSETS_USD || !DEBT_ADDRESSES.has(loanAsset.address.toLowerCase())) {
        return [];
      }

      const collateralApy = rate.apy || 0;
      const borrowApy = (market.borrowApy || 0) * 100;
      const maxLeverage = getMaxLeverage(market.lltv);
      const leverageMarket: LeverageData = {
        id: market.uniqueKey,
        name: `${collateralAsset.symbol}/${loanAsset.symbol}`,
        project: 'Morpho',
        collateral: {
          symbol: collateralAsset.symbol,
          coins: [{ address: collateralAsset.address, symbol: collateralAsset.symbol, image: rate.image }],
        },
        debt: toLpCoins([loanAsset], mainListCoins)[0],
        liquidity: Math.max(market.liquidityAssetsUsd, 0),
        utilization: (market.utilization || 0) * 100,
        maxLeverage,
        maxLtv: market.lltv * 100,
        collateralApy,
        pointsMultiplier: getEthenaMultiplier('Morpho', [collateralAsset.symbol]),
        borrowApy,
        maxNetApy: getNetApy(collateralApy, borrowApy, maxLeverage),
        link: getMorphoMarketUrl(market.uniqueKey),
        positionSource: {
          kind: 'morpho',
          contract: MORPHO_BLUE as `0x${string}`,
          marketId: market.uniqueKey as `0x${string}`,
          collateralDecimals: collateralAsset.decimals,
          debtDecimals: loanAsset.decimals,
          collateralPrice: collateralAsset.priceUsd || undefined,
          collateralVaultPrice: rate.vaultPrice,
        },
      };
      return isWorthLeveraging(leverageMarket) ? [leverageMarket] : [];
    });
  } catch (err) {
    console.error('Failed to fetch Morpho markets:', err);
    return [];
  }
}
