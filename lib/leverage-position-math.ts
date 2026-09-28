import { formatUnits, parseAbi } from 'viem';
import { LeverageData } from '@/app/types';

// the market reports both in dollars, getCollateralValue reverts for a user without an escrow
export const firmAbi = parseAbi([
  'function debts(address) view returns (uint256)',
  'function getCollateralValue(address) view returns (uint256)',
]);
// collateral, borrowed token left in the amm after a soft liquidation, debt, bands
export const llamalendAbi = parseAbi(['function user_state(address) view returns (uint256[4])']);
export const morphoAbi = parseAbi([
  'function position(bytes32, address) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)',
  'function market(bytes32) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)',
]);

export interface LeveragePosition {
  market: LeverageData;
  // collateral value in USD
  deposits: number;
  // debt in USD, a debt token counting as a dollar
  debt: number;
  // rate paid on the debt, the market's own unless the borrower set theirs
  borrowApy: number;
  equity: number;
  // how much the deposits are worth per dollar of equity
  leverage: number;
  // what the deposits earn minus what the debt costs, on the equity
  netApy: number;
}

export type CallResult = { status: 'success'; result: unknown } | { status: 'failure'; error: Error };

// dust left behind by a closed position isn't worth a row
const MIN_POSITION_USD = 1;

const toNumber = (value: unknown, decimals: number) =>
  typeof value === 'bigint' ? Number(formatUnits(value, decimals)) : 0;

const valueOf = (result?: CallResult) => result?.status === 'success' ? result.result : undefined;

// Deposits and debt of a user in one market, from that market's call results
export function readPosition(market: LeverageData, results: CallResult[]): { deposits: number; debt: number } {
  const source = market.positionSource!;
  const { collateralDecimals, debtDecimals, collateralVaultPrice, oraclePrice } = source;
  // a yield-bearing stable is valued like everywhere else in the app, the market's own price is the fallback
  const price = collateralVaultPrice || source.collateralPrice || 0;

  if (source.kind === 'firm') {
    const collateralValue = toNumber(valueOf(results[1]), collateralDecimals);
    return {
      debt: toNumber(valueOf(results[0]), debtDecimals),
      // the market values the collateral itself, so its amount comes back out of that value
      deposits: collateralVaultPrice && oraclePrice
        ? collateralValue / oraclePrice * collateralVaultPrice
        : collateralValue,
    };
  }
  if (source.kind === 'llamalend') {
    const state = valueOf(results[0]) as readonly bigint[] | undefined;
    if (!state) return { deposits: 0, debt: 0 };
    const [collateralAmount, borrowedInAmm, debt] = state;
    return {
      // a soft liquidated position holds part of its collateral as the borrowed token
      deposits: toNumber(collateralAmount, collateralDecimals) * price + toNumber(borrowedInAmm, debtDecimals),
      debt: toNumber(debt, debtDecimals),
    };
  }

  const position = valueOf(results[0]) as readonly bigint[] | undefined;
  const marketState = valueOf(results[1]) as readonly bigint[] | undefined;
  if (!position || !marketState) return { deposits: 0, debt: 0 };
  const [, borrowShares, collateralAmount] = position;
  const [, , totalBorrowAssets, totalBorrowShares] = marketState;
  return {
    deposits: toNumber(collateralAmount, collateralDecimals) * price,
    debt: totalBorrowShares ? toNumber(borrowShares * totalBorrowAssets / totalBorrowShares, debtDecimals) : 0,
  };
}

const getPositionNetApy = (collateralApy: number, deposits: number, borrowApy: number, debt: number, equity: number) =>
  equity > 0 ? (collateralApy * deposits - borrowApy * debt) / equity : 0;

// What the position is worth to its holder: the equity, the leverage on it, and the APY it nets
export function toLeveragePosition(market: LeverageData, deposits: number, debt: number): LeveragePosition | undefined {
  if (deposits < MIN_POSITION_USD) return undefined;
  const equity = deposits - debt;
  return {
    market,
    deposits,
    debt,
    borrowApy: market.borrowApy,
    equity,
    leverage: equity > 0 ? deposits / equity : 0,
    netApy: getPositionNetApy(market.collateralApy, deposits, market.borrowApy, debt, equity),
  };
}

// The same position at another borrow rate, for a borrower whose fixed rate isn't the market's
export const atBorrowApy = (position: LeveragePosition, borrowApy: number): LeveragePosition => ({
  ...position,
  borrowApy,
  netApy: getPositionNetApy(position.market.collateralApy, position.deposits, borrowApy, position.debt, position.equity),
});
