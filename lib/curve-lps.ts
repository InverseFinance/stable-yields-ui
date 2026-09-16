import { isAddress } from 'viem';
import { LpData, StakingData } from '@/app/types';
import { fetchEnsoPriceMap, fetchJson, getMainListCoins, hasMainListCoin, MIN_POOL_TVL_USD, toLpCoins } from '@/lib/lps';

// stableswap-ng pools on Ethereum; the API caps pagination at 50
const CURVE_POOLS_API = `https://prices.curve.finance/v2/pools/?pagination=50&pool_type=stableswapng&min_tvl=${MIN_POOL_TVL_USD}&chain_id=1&sort_by=aggregate_apr&sort_direction=desc`;
const MAX_PAGES = 10;

interface CurveApiPool {
  name: string;
  address: string;
  tvl_usd: number;
  coins: { symbol: string; address: string }[];
  base_daily_apr: number;
  crv_apr: number;
  extra_rewards_apr: { apr: number }[];
  merkle_apr: number;
}

interface CurveApiPoolsPage {
  count: number;
  pagination: number;
  pools: CurveApiPool[];
}

export const getCurvePoolUrl = (address: string) => `https://www.curve.finance/dex/ethereum/pools/${address}`;

const fetchPoolsPage = (page: number) => fetchJson<CurveApiPoolsPage>(`${CURVE_POOLS_API}&page=${page}`);

async function fetchAllPools(): Promise<CurveApiPool[]> {
  const firstPage = await fetchPoolsPage(1);
  const pageCount = Math.min(Math.ceil(firstPage.count / firstPage.pagination), MAX_PAGES);
  const otherPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) => fetchPoolsPage(i + 2)),
  );
  return [firstPage, ...otherPages].flatMap(p => p.pools);
}

// Curve LPs having at least one coin that is a stablecoin from the main list
export async function fetchCurveLps(rates: StakingData[]): Promise<LpData[]> {
  try {
    const mainListCoins = getMainListCoins(rates);
    const pools = (await fetchAllPools()).filter(p =>
      isAddress(p.address, { strict: false }) && hasMainListCoin(p.coins, mainListCoins)
    );

    const lpPrices = await fetchEnsoPriceMap(pools.map(p => p.address as `0x${string}`));

    return pools.map(p => {
      const coins = toLpCoins(p.coins, mainListCoins);
      const symbol = coins.map(c => c.symbol).join('/');
      // for stableswap-ng pools the pool address is also the LP token address
      const address = p.address as `0x${string}`;
      const baseApr = p.base_daily_apr || 0;
      // CRV (unboosted) + extra gauge rewards + merkle incentives
      const rewardsApr = (p.crv_apr || 0)
        + (p.extra_rewards_apr || []).reduce((sum, r) => sum + (r.apr || 0), 0)
        + (p.merkle_apr || 0);
      return {
        address,
        name: p.name,
        symbol,
        project: 'Curve',
        coins,
        tvl: p.tvl_usd,
        totalApr: baseApr + rewardsApr,
        link: getCurvePoolUrl(p.address),
        zap: {
          tokenAddress: address,
          // stableswap-ng LP tokens always have 18 decimals
          decimals: 18,
          symbol: `${symbol} LP`,
          // holding the LP token only earns the base APR, rewards require staking it in the gauge
          apr: baseApr,
          price: lpPrices[address.toLowerCase()],
        },
      };
    });
  } catch (err) {
    console.error('Failed to fetch Curve LPs:', err);
    return [];
  }
}
