import { isAddress } from 'viem';
import { LeverageData, StakingData } from '@/app/types';
import { getCollateralRates, getNetApy, isWorthLeveraging, MIN_MARKET_ASSETS_USD } from '@/lib/leverage';
import { getEthenaMultiplier } from '@/lib/ethena-points';
import { fetchJson, getMainListCoins, toLpCoins } from '@/lib/lps';

const LENDING_MARKETS_API = 'https://prices.curve.finance/v1/lending/markets';
const CRVUSD_ADDRESS = '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e';

interface LlamalendApiMarket {
  name: string;
  version: number;
  controller: string;
  borrow_apy: number;
  total_debt_usd: number;
  total_assets_usd: number;
  max_ltv: number;
  // highest leverage the max LTV allows
  leverage: number;
  collateral_token: { symbol: string; address: string; decimals: number };
  // collateral price in the borrowed token
  price_oracle: number;
  borrowed_token: { symbol: string; address: string };
}

export const getLlamalendMarketUrl = (controller: string) =>
  `https://www.curve.finance/lend/ethereum/markets/${controller}`;

// Llamalend markets borrowing crvUSD against a stablecoin of the main list
export async function fetchLlamalendMarkets(rates: StakingData[]): Promise<LeverageData[]> {
  try {
    const collateralRates = getCollateralRates(rates);
    const mainListCoins = getMainListCoins(rates);
    const { chains } = await fetchJson<{ chains: Record<string, { data: LlamalendApiMarket[] }> }>(LENDING_MARKETS_API);

    return (chains.ethereum?.data || []).flatMap(market => {
      const rate = collateralRates.get(market.collateral_token.address.toLowerCase());
      if (
        !rate
        || market.borrowed_token.address.toLowerCase() !== CRVUSD_ADDRESS
        || market.total_assets_usd < MIN_MARKET_ASSETS_USD
        || !isAddress(market.controller, { strict: false })
      ) {
        return [];
      }

      const collateralApy = rate.apy || 0;
      const borrowApy = market.borrow_apy || 0;
      const maxLeverage = market.leverage || 1;
      const leverageMarket: LeverageData = {
        id: market.controller,
        name: market.name,
        project: 'Llamalend',
        version: market.version,
        collateral: {
          symbol: market.collateral_token.symbol,
          coins: [{ address: market.collateral_token.address, symbol: market.collateral_token.symbol, image: rate.image }],
        },
        debt: toLpCoins([market.borrowed_token], mainListCoins)[0],
        liquidity: Math.max(market.total_assets_usd - market.total_debt_usd, 0),
        utilization: market.total_assets_usd ? market.total_debt_usd / market.total_assets_usd * 100 : 0,
        maxLeverage,
        maxLtv: market.max_ltv,
        collateralApy,
        pointsMultiplier: getEthenaMultiplier('Llamalend', [market.collateral_token.symbol]),
        borrowApy,
        maxNetApy: getNetApy(collateralApy, borrowApy, maxLeverage),
        link: getLlamalendMarketUrl(market.controller),
        positionSource: {
          kind: 'llamalend',
          contract: market.controller as `0x${string}`,
          collateralDecimals: market.collateral_token.decimals || 18,
          debtDecimals: 18,
          collateralPrice: market.price_oracle,
          collateralVaultPrice: rate.vaultPrice,
        },
      };
      return isWorthLeveraging(leverageMarket) ? [leverageMarket] : [];
    });
  } catch (err) {
    console.error('Failed to fetch Llamalend markets:', err);
    return [];
  }
}
