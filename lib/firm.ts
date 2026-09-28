import { LeverageData, LpCoin, StakingData } from '@/app/types';
import { getCollateralRates, isWorthLeveraging, MIN_MARKET_ASSETS_USD } from '@/lib/leverage';
import { getEthenaMultiplier } from '@/lib/ethena-points';
import { fetchJson, getMainListCoins, toLpCoins } from '@/lib/lps';

const FIRM_MARKETS_API = 'https://www.inverse.finance/api/f2/fixed-markets';
const DOLA = { address: '0x865377367054516e17014CcdED1e7d814EDC9ce4', symbol: 'DOLA' };
// coins of the LP collaterals that aren't in the main list, so they still get an icon
const EXTRA_COINS = [
  DOLA,
  // Resupply's reUSD, the one in the FiRM pools, another token shares its symbol
  { address: '0x57aB1E0003F623289CD798B1824Be09a793e4Bec', symbol: 'reUSD' },
];

interface FirmApiMarket {
  name: string;
  address: string;
  collateral: string;
  collateralSymbol: string;
  borrowPaused: boolean;
  isPendle: boolean;
  // DOLA left to borrow in the market, zero once its ceiling is reached
  dolaLiquidity: number;
  // DOLA borrowed from the market, what it holds
  totalDebt: number;
  // max LTV, as a ratio
  collateralFactor: number;
  // USD price the market puts on the collateral
  price: number;
  supplyApy: number;
  extraApy: number;
  extraRewardApy: number;
  maxLeverage: number;
  maxNetApy: number;
}

export const getFirmMarketUrl = (name: string) => `https://firm.inverse.finance/markets/${name}`;

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
    const [dolaCoin, ...otherCoins] = toLpCoins(EXTRA_COINS, mainListCoins);
    const mainListSymbols = new Set(rates.map(rate => rate.symbol.toLowerCase()));
    const coinsBySymbol = new Map<string, LpCoin>([
      ...[dolaCoin, ...otherCoins].map(coin => [coin.symbol.toLowerCase(), coin] as const),
      ...rates.flatMap(rate => {
        const address = rate.zapAddress || rate.address;
        return address ? [[rate.symbol.toLowerCase(), { address, symbol: rate.symbol, image: rate.image }] as const] : [];
      }),
    ]);

    const { markets, fixedBorrowApy } = await fetchJson<{ markets: FirmApiMarket[]; fixedBorrowApy: number }>(FIRM_MARKETS_API);

    return (markets || []).flatMap(market => {
      // Pendle collaterals mature, they aren't a position to hold for the collateral yield
      // a market can be worth listing with nothing left to borrow, its size is what it lent out
      if (market.borrowPaused || market.isPendle || market.totalDebt < MIN_MARKET_ASSETS_USD) return [];

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
        pointsMultiplier: getEthenaMultiplier('FiRM', collateral.coins.map(coin => coin.symbol)),
        borrowApy: fixedBorrowApy || 0,
        // FiRM computes it for the leverage its escrows allow
        maxNetApy: market.maxNetApy || 0,
        link: getFirmMarketUrl(market.name),
        positionSource: {
          kind: 'firm',
          contract: market.address as `0x${string}`,
          // the market reports the collateral value and the debt in dollars
          collateralDecimals: 18,
          debtDecimals: 18,
          // an LP collateral has no price of ours, its market's valuation stands
          collateralVaultPrice: stable ? stable.vaultPrice : undefined,
          oraclePrice: market.price,
        },
      };
      return isWorthLeveraging(leverageMarket) ? [leverageMarket] : [];
    });
  } catch (err) {
    console.error('Failed to fetch FiRM markets:', err);
    return [];
  }
}
