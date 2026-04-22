import { SUPPORTED_TOKENS, ETH_ADDRESS } from './tokens';

export type TokenPrices = Record<string, number>; // lowercase address → USD price

// Server-side in-memory cache to avoid hammering CoinGecko on every request
let _cache: { prices: TokenPrices; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchTokenPrices(): Promise<TokenPrices> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache.prices;
  }

  const prices: TokenPrices = {};

  const cgIds = SUPPORTED_TOKENS
    .map(t => t.coingeckoId);

  try {
    const [tokensRes] = await Promise.all([
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgIds.join(',')}&vs_currencies=usd`, {
        headers: { Accept: 'application/json' },
      }),
    ]);

    if (tokensRes.ok) {
      const tokensData: Record<string, { usd?: number }> = await tokensRes.json();
      for (const [cgId, val] of Object.entries(tokensData)) {
        const token = SUPPORTED_TOKENS.find(st => st.coingeckoId === cgId);
        if (val?.usd != null && !!token) prices[token.address.toLowerCase()] = val.usd;
      }
    }
  } catch (err) {
    console.error('fetchTokenPrices failed:', err);
  }

  _cache = { prices, fetchedAt: Date.now() };
  return prices;
}
