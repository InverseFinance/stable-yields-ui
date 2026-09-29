import { LeverageData, StakingData } from '@/app/types';

export const ETHENA_ICON = 'https://assets.coingecko.com/coins/images/36530/standard/ethena.png?1711701436';

export const MIN_MARKET_ASSETS_USD = 100_000;
// borrowable amount left, under which there is no room to open a loop
const MIN_LIQUIDITY_USD = 100_000;
// under that, the market isn't made for looping the collateral
export const MIN_LEVERAGE = 5;
// Yield of a position at this leverage: the collateral earns on the whole position, the borrowed part costs the borrow rate
export const getNetApy = (collateralApy: number, borrowApy: number, leverage: number) =>
  collateralApy * leverage - borrowApy * (leverage - 1);

// Highest leverage a max LTV allows, 98% LTV meaning 50x
export const getMaxLeverage = (maxLtv: number) => maxLtv > 0 && maxLtv < 1 ? 1 / (1 - maxLtv) : 1;

// leverage belongs in the list only when it beats holding the collateral
export const isWorthLeveraging = (market: LeverageData) =>
  market.maxLeverage >= MIN_LEVERAGE && market.maxNetApy > market.collateralApy;

// a market that has lent out all it can is no opportunity, a position held in it still is one
export const hasRoomToBorrow = (market: LeverageData) => market.liquidity >= MIN_LIQUIDITY_USD;

// main list stables keyed by the lowercase address of the token holders get, the one used as collateral
export function getCollateralRates(rates: StakingData[]): Map<string, StakingData> {
  return new Map(rates.flatMap(rate => {
    const address = (rate.zapAddress || rate.address)?.toLowerCase();
    return address ? [[address, rate] as const] : [];
  }));
}
