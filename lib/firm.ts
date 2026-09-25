import { LeverageData, LpCoin, StakingData } from '@/app/types';
import { getCollateralRates, isWorthLeveraging, MIN_MARKET_ASSETS_USD } from '@/lib/leverage';
import { fetchJson, getMainListCoins, toLpCoins } from '@/lib/lps';

const FIRM_MARKETS_API = 'https://www.inverse.finance/api/f2/fixed-markets';
const DOLA = { address: '0x865377367054516e17014CcdED1e7d814EDC9ce4', symbol: 'DOLA' };

interface FirmApiMarket {
  name: string;
  address: string;
  collateral: string;
  collateralSymbol: string;
  borrowPaused: boolean;
  isPendle: boolean;
  // DOLA left to borrow in the market
  dolaLiquidity: number;
  // max LTV, as a ratio
  collateralFactor: number;
  supplyApy: number;
  extraApy: number;
  extraRewardApy: number;
  maxLeverage: number;
  maxNetApy: number;
}

export const getFirmMarketUrl = (name: string) => `https://www.inverse.finance/firm/${name}`;

// FiRM names its LP markets after their coins, e.g. yv-sUSDe-DOLA
const getMarketCoins = (name: string, coinsBySymbol: Map<string, LpCoin>) =>
  name.split('-').flatMap(part => {
    const coin = coinsBySymbol.get(part.toLowerCase());
    return coin ? [coin] : [];
  });

// FiRM markets borrowing DOLA at a fixed rate, against a stablecoin of the main list or an LP holding one
export async function fetchFirmMarkets(rates: StakingData[]): Promise<LeverageData[]> {
  try {
    const collateralRates = getCollateralRates(rates);
    const mainListCoins = getMainListCoins(rates);
    const [dolaCoin] = toLpCoins([DOLA], mainListCoins);
    const mainListSymbols = new Set(rates.map(rate => rate.symbol.toLowerCase()));
    const coinsBySymbol = new Map<string, LpCoin>([
      [DOLA.symbol.toLowerCase(), dolaCoin],
      ...rates.flatMap(rate => {
        const address = rate.zapAddress || rate.address;
        return address ? [[rate.symbol.toLowerCase(), { address, symbol: rate.symbol, image: rate.image }] as const] : [];
      }),
    ]);

    const { markets, fixedBorrowApy } = await fetchJson<{ markets: FirmApiMarket[]; fixedBorrowApy: number }>(FIRM_MARKETS_API);

    return (markets || []).flatMap(market => {
      // Pendle collaterals mature, they aren't a position to hold for the collateral yield
      if (market.borrowPaused || market.isPendle || market.dolaLiquidity < MIN_MARKET_ASSETS_USD) return [];

      const stable = collateralRates.get(market.collateral?.toLowerCase());
      const isListedLp = !stable && market.name.split('-').some(part => mainListSymbols.has(part.toLowerCase()));
      if (!stable && !isListedLp) return [];

      const collateral = stable
        ? { symbol: stable.symbol, coins: [{ address: market.collateral, symbol: stable.symbol, image: stable.image }] }
        : { symbol: market.name, coins: getMarketCoins(market.name, coinsBySymbol) };
      // the rate FiRM shows for the collateral, its rewards included
      const collateralApy = (market.supplyApy || 0) + (market.extraRewardApy || 0) + (market.extraApy || 0);
      const leverageMarket: LeverageData = {
        id: market.address,
        name: market.name,
        project: 'FiRM',
        collateral,
        debt: dolaCoin,
        fixedBorrowRate: true,
        liquidity: market.dolaLiquidity,
        // a CDP market lends against its own collateral, there is nothing to utilise
        utilization: undefined,
        maxLeverage: market.maxLeverage || 1,
        maxLtv: (market.collateralFactor || 0) * 100,
        collateralApy,
        borrowApy: fixedBorrowApy || 0,
        // FiRM computes it for the leverage its escrows allow
        maxNetApy: market.maxNetApy || 0,
        link: getFirmMarketUrl(market.name),
      };
      return isWorthLeveraging(leverageMarket) ? [leverageMarket] : [];
    });
  } catch (err) {
    console.error('Failed to fetch FiRM markets:', err);
    return [];
  }
}
