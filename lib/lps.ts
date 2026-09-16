import { LpCoin, StakingData } from '@/app/types';
import { fetchEnsoPrices } from '@/lib/enso';

export const MIN_POOL_TVL_USD = 1_000_000;
export const REQUEST_TIMEOUT_MS = 10_000;

// stablecoins of the main list, keyed by lowercase token address
export type MainListCoins = Map<string, Omit<LpCoin, 'address'>>;

export function getMainListCoins(rates: StakingData[]): MainListCoins {
  const coins: MainListCoins = new Map();
  for (const r of rates) {
    if (r.address) coins.set(r.address.toLowerCase(), { symbol: r.symbol, image: r.image });
    if (r.zapAddress) coins.set(r.zapAddress.toLowerCase(), { symbol: r.zapSymbol || r.symbol, image: r.image });
  }
  return coins;
}

export const hasMainListCoin = (coins: { address: string }[], mainListCoins: MainListCoins) =>
  coins.some(c => mainListCoins.has(c.address.toLowerCase()));

// main list coins keep their symbol and image, other coins use Curve's token assets
export const toLpCoins = (coins: { address: string; symbol: string }[], mainListCoins: MainListCoins): LpCoin[] =>
  coins.map(c => ({
    address: c.address,
    symbol: c.symbol,
    image: `https://cdn.jsdelivr.net/gh/curvefi/curve-assets/images/assets/${c.address.toLowerCase()}.png`,
    ...mainListCoins.get(c.address.toLowerCase()),
  }));

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} responded with ${res.status}`);
  return res.json();
}

export function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Enso USD prices keyed by lowercase token address, empty when unavailable
export async function fetchEnsoPriceMap(addresses: `0x${string}`[]): Promise<Record<string, number>> {
  if (!addresses.length) return {};
  try {
    // the Enso SDK has no request timeout, don't let it hang the page render
    const prices = await withTimeout(fetchEnsoPrices(addresses));
    // unknown tokens come back as null entries
    return Object.fromEntries(
      prices.filter(p => !!p?.price).map(p => [p.address.toLowerCase(), Number(p.price)]),
    );
  } catch (err) {
    console.error('Failed to fetch Enso prices:', err);
    return {};
  }
}
