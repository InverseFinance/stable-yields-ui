import { isAddress } from 'viem';
import { LpData, StakingData } from '@/app/types';
import { fetchEnsoTokensData } from '@/lib/enso';
import { fetchCurveVirtualPrices, fetchEnsoPriceMap, fetchJson, getMainListCoins, hasMainListCoin, toLpCoins, withTimeout } from '@/lib/lps';

const YEARN_VAULTS_API = 'https://kong.yearn.fi/api/rest/list/vaults/1';
const MIN_VAULT_TVL_USD = 100_000;

interface YearnApiVault {
  address: string;
  name: string;
  decimals: number;
  tvl: number;
  // LP tokens per share, with the vault decimals
  pricePerShare: number | null;
  isRetired: boolean;
  isHidden: boolean;
  asset: { address: string; name: string };
  performance: { estimated: { apy: number | null } | null } | null;
}

export const getYearnVaultUrl = (address: string) => `https://yearn.fi/vaults/1/${address}`;

// LP assets are named after their coins, e.g. "DOLA/sUSDe"
const getAssetSymbols = (assetName: string) => assetName.split(/[/-]/).map(s => s.trim()).filter(Boolean);

// Yearn vaults of LPs having at least one coin that is a stablecoin from the main list
export async function fetchYearnLps(rates: StakingData[]): Promise<LpData[]> {
  try {
    const mainListCoins = getMainListCoins(rates);
    const mainListSymbols = new Set([...mainListCoins.values()].map(c => c.symbol.toLowerCase()));
    const vaults = (await fetchJson<YearnApiVault[]>(YEARN_VAULTS_API)).filter(v =>
      !v.isRetired
      && !v.isHidden
      && v.tvl >= MIN_VAULT_TVL_USD
      && isAddress(v.address, { strict: false })
      && isAddress(v.asset.address, { strict: false })
      && /[/-]/.test(v.asset.name)
      && getAssetSymbols(v.asset.name).some(s => mainListSymbols.has(s.toLowerCase()))
    );
    if (!vaults.length) return [];

    // the Yearn API doesn't list the LP coins, Enso resolves them with their addresses
    const assetAddresses = vaults.map(v => v.asset.address as `0x${string}`);
    const [lpTokens, vaultPrices, lpVirtualPrices] = await Promise.all([
      withTimeout(fetchEnsoTokensData(assetAddresses)),
      fetchEnsoPriceMap(vaults.map(v => v.address as `0x${string}`)),
      fetchCurveVirtualPrices(assetAddresses),
    ]);
    const lpCoinsByAsset = new Map(lpTokens.data.map(t => [t.address.toLowerCase(), t.underlyingTokens || []]));

    return vaults.flatMap(v => {
      const assetSymbols = getAssetSymbols(v.asset.name);
      const coins = toLpCoins(
        (lpCoinsByAsset.get(v.asset.address.toLowerCase()) || []).map(t => ({
          address: t.address,
          // Enso upper-cases symbols, keep the casing of the asset name
          symbol: assetSymbols.find(s => s.toLowerCase() === t.symbol?.toLowerCase()) || t.symbol || '',
        })),
        mainListCoins,
      );
      if (!hasMainListCoin(coins, mainListCoins)) return [];

      const symbol = coins.map(c => c.symbol).join('/');
      const totalApr = (v.performance?.estimated?.apy || 0) * 100;
      const vaultShare = {
        address: v.address as `0x${string}`,
        decimals: v.decimals,
        symbol: `${symbol} vault`,
        // the vault compounds all the rewards for its holders
        apr: totalApr,
        price: vaultPrices[v.address.toLowerCase()],
      };
      const lpVirtualPrice = lpVirtualPrices[v.asset.address.toLowerCase()];
      const sharePrice = v.pricePerShare && lpVirtualPrice
        ? v.pricePerShare / 10 ** v.decimals * lpVirtualPrice
        : undefined;
      return [{
        address: v.asset.address as `0x${string}`,
        name: v.name,
        symbol,
        project: 'Yearn',
        coins,
        tvl: v.tvl,
        totalApr,
        link: getYearnVaultUrl(v.address),
        zap: vaultShare,
        // vault shares are worth pricePerShare LP tokens, valued at the Curve pool's virtual price
        position: { ...vaultShare, price: sharePrice ?? vaultShare.price },
      }];
    });
  } catch (err) {
    console.error('Failed to fetch Yearn LPs:', err);
    return [];
  }
}
