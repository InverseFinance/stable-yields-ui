import { createPublicClient, erc20Abi, fallback, formatUnits, http, isAddress, parseAbi, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { LpData, StakingData } from '@/app/types';
import { fetchJson, getMainListCoins, hasMainListCoin, MIN_POOL_TVL_USD, REQUEST_TIMEOUT_MS, toLpCoins, withTimeout } from '@/lib/lps';

const CONVEX_POOLS_API = 'https://curve.convexfinance.com/api/curve/pools';
const CONVEX_APYS_API = 'https://curve.convexfinance.com/api/curve-apys';
const LLAMA_PRICES_API = 'https://coins.llama.fi/prices/current';
const CRV_ADDRESS = '0xD533a949740bb3306d119CC777fa900bA034cd52';
const CVX_ADDRESS = '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B';
const SECONDS_PER_YEAR = 31_536_000;

// ConvexToken mints less CVX per CRV at each supply cliff
const CVX_MAX_SUPPLY = parseUnits('100000000', 18);
const CVX_TOTAL_CLIFFS = BigInt(1000);

const rewardPoolAbi = parseAbi([
  'function rewardRate() view returns (uint256)',
  'function periodFinish() view returns (uint256)',
  'function extraRewardsLength() view returns (uint256)',
  'function extraRewards(uint256) view returns (address)',
  'function rewardToken() view returns (address)',
]);
// reward tokens of Convex stashes can be wrapped, the wrapper exposes the underlying token
const stashTokenWrapperAbi = parseAbi(['function token() view returns (address)']);

// concurrent reads are batched into multicalls
const client = createPublicClient({
  chain: mainnet,
  batch: { multicall: true },
  transport: fallback([
    ...(process.env.RPC_URL ? [http(process.env.RPC_URL)] : []),
    http(),
    http('https://ethereum-rpc.publicnode.com'),
  ]),
});

interface ConvexApiPool {
  name: string;
  lpTokenAddress: string;
  usdTotal: number;
  baseApy?: number;
  isBroken?: boolean;
  coins: { symbol: string; address: string }[];
  convexPoolData: {
    id: number;
    crvRewards: string;
    shutdown: boolean;
    // amount staked on Convex
    usdTotal: number;
  };
}

interface RewardStream {
  rewardRate: bigint;
  periodFinish: bigint;
}

export const getConvexPoolUrl = (id: number) => `https://curve.convexfinance.com/stake/ethereum/${id}`;

const isStreaming = (stream: RewardStream) => Number(stream.periodFinish) * 1000 > Date.now();

const getStreamApr = (stream: RewardStream, decimals: number, price: number, tvl: number) =>
  isStreaming(stream) && tvl > 0
    ? Number(formatUnits(stream.rewardRate, decimals)) * SECONDS_PER_YEAR * price / tvl * 100
    : 0;

function getCvxPerCrv(cvxSupply: bigint) {
  const cliff = cvxSupply / (CVX_MAX_SUPPLY / CVX_TOTAL_CLIFFS);
  return cliff < CVX_TOTAL_CLIFFS ? Number(CVX_TOTAL_CLIFFS - cliff) / Number(CVX_TOTAL_CLIFFS) : 0;
}

async function readRewardStream(address: `0x${string}`): Promise<RewardStream> {
  const [rewardRate, periodFinish] = await Promise.all([
    client.readContract({ address, abi: rewardPoolAbi, functionName: 'rewardRate' }),
    client.readContract({ address, abi: rewardPoolAbi, functionName: 'periodFinish' }),
  ]);
  return { rewardRate, periodFinish };
}

async function readExtraRewardToken(rewardPool: `0x${string}`) {
  const rewardToken = await client.readContract({ address: rewardPool, abi: rewardPoolAbi, functionName: 'rewardToken' });
  const token = await client.readContract({ address: rewardToken, abi: stashTokenWrapperAbi, functionName: 'token' })
    .catch(() => rewardToken);
  const decimals = await client.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' });
  return { token, decimals };
}

// CRV stream and the extra reward streams that are still active
async function readPoolRewards(rewardPool: `0x${string}`) {
  const [crv, extrasLength] = await Promise.all([
    readRewardStream(rewardPool),
    client.readContract({ address: rewardPool, abi: rewardPoolAbi, functionName: 'extraRewardsLength' }),
  ]);
  const extraPools = await Promise.all(
    Array.from({ length: Number(extrasLength) }, (_, i) =>
      client.readContract({ address: rewardPool, abi: rewardPoolAbi, functionName: 'extraRewards', args: [BigInt(i)] })
    ),
  );
  const extras = await Promise.all(extraPools.map(async address => {
    const stream = await readRewardStream(address);
    if (!isStreaming(stream)) return undefined;
    // an extra reward that can't be read is left out rather than failing the pool
    return readExtraRewardToken(address).then(token => ({ ...stream, ...token })).catch(() => undefined);
  }));
  return { crv, extras: extras.filter(e => !!e) };
}

async function fetchLlamaPrices(addresses: string[]): Promise<Record<string, number>> {
  const { coins } = await fetchJson<{ coins: Record<string, { price: number }> }>(
    `${LLAMA_PRICES_API}/${addresses.map(a => `ethereum:${a.toLowerCase()}`).join(',')}`,
  );
  return Object.fromEntries(Object.entries(coins).map(([key, { price }]) => [key.split(':')[1].toLowerCase(), price]));
}

// the Convex UI values CRV rewards with the CRV price of its APYs API
async function fetchConvexCrvPrice(): Promise<number | undefined> {
  const { apys } = await fetchJson<{ apys: Record<string, { crvPrice?: number }> }>(CONVEX_APYS_API);
  return Object.values(apys).find(a => a.crvPrice)?.crvPrice;
}

// Current reward APRs as shown by the Convex UI: CRV, CVX minted with it and extra rewards,
// from the reward streams of each pool's Convex reward contract
async function fetchRewardAprs(pools: ConvexApiPool[], convexCrvPrice?: number): Promise<number[]> {
  const [poolsRewards, cvxSupply] = await Promise.all([
    Promise.all(pools.map(p => readPoolRewards(p.convexPoolData.crvRewards as `0x${string}`))),
    client.readContract({ address: CVX_ADDRESS, abi: erc20Abi, functionName: 'totalSupply' }),
  ]);
  const prices = await fetchLlamaPrices([
    CRV_ADDRESS,
    CVX_ADDRESS,
    ...poolsRewards.flatMap(r => r.extras.map(e => e.token)),
  ]);
  const crvPrice = convexCrvPrice || prices[CRV_ADDRESS.toLowerCase()];
  if (!crvPrice) throw new Error('Missing CRV price');
  // CVX is minted pro rata of the CRV rewards
  const cvxValuePerCrvValue = getCvxPerCrv(cvxSupply) * (prices[CVX_ADDRESS.toLowerCase()] || 0) / crvPrice;

  return pools.map((p, i) => {
    const tvl = p.convexPoolData.usdTotal;
    const { crv, extras } = poolsRewards[i];
    const crvApr = getStreamApr(crv, 18, crvPrice, tvl);
    const cvxApr = crvApr * cvxValuePerCrvValue;
    const extrasApr = extras.reduce((sum, e) => sum + getStreamApr(e, e.decimals, prices[e.token.toLowerCase()] || 0, tvl), 0);
    return crvApr + cvxApr + extrasApr;
  });
}

// Convex pools of Curve LPs having at least one coin that is a stablecoin from the main list
export async function fetchConvexLps(rates: StakingData[]): Promise<LpData[]> {
  try {
    const mainListCoins = getMainListCoins(rates);
    const [{ pools }, convexCrvPrice] = await Promise.all([
      fetchJson<{ pools: ConvexApiPool[] }>(CONVEX_POOLS_API),
      fetchConvexCrvPrice().catch(() => undefined),
    ]);
    const matchingPools = pools.filter(p =>
      !p.convexPoolData.shutdown
      && !p.isBroken
      && p.usdTotal >= MIN_POOL_TVL_USD
      && isAddress(p.lpTokenAddress, { strict: false })
      && isAddress(p.convexPoolData.crvRewards, { strict: false })
      && hasMainListCoin(p.coins, mainListCoins)
    );
    if (!matchingPools.length) return [];

    // on-chain reads go through public RPCs, don't let them hang the page render
    const rewardAprs = await withTimeout(fetchRewardAprs(matchingPools, convexCrvPrice), 3 * REQUEST_TIMEOUT_MS);

    return matchingPools.map((p, i) => {
      const coins = toLpCoins(p.coins, mainListCoins);
      const baseApr = p.baseApy || 0;
      return {
        address: p.lpTokenAddress as `0x${string}`,
        // Curve LP tokens have 18 decimals
        decimals: 18,
        name: p.name,
        symbol: coins.map(c => c.symbol).join('/'),
        project: 'Convex',
        coins,
        tvl: p.convexPoolData.usdTotal,
        baseApr,
        rewardsApr: rewardAprs[i],
        totalApr: baseApr + rewardAprs[i],
        link: getConvexPoolUrl(p.convexPoolData.id),
        isZappable: false,
      };
    });
  } catch (err) {
    console.error('Failed to fetch Convex LPs:', err);
    return [];
  }
}
