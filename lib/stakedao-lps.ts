import { isAddress } from 'viem';
import { LpData, StakingData } from '@/app/types';
import { fetchJson, getMainListCoins, hasMainListCoin, toLpCoins } from '@/lib/lps';

const STAKE_DAO_VAULTS_API = 'https://hub.stakedao.org/v1/vaults';
const MIN_VAULT_TVL_USD = 100_000;

interface StakeDaoApiVault {
  name: string;
  protocol: string;
  chainId: number;
  vault: string;
  isLending: boolean;
  lpToken: { address: string; decimals: number };
  coins: { symbol: string; address: string }[];
  lpPriceInUsd: number;
  tvl: number;
  apr: { current: { total: number } };
}

export const getStakeDaoVaultUrl = (v: Pick<StakeDaoApiVault, 'protocol' | 'chainId' | 'vault'>) =>
  `https://app.stakedao.org/strategy?protocol=${v.protocol}&vault=${v.chainId}-${v.vault}`;

// Stake DAO vaults of LPs having at least one coin that is a stablecoin from the main list
export async function fetchStakeDaoLps(rates: StakingData[]): Promise<LpData[]> {
  try {
    const mainListCoins = getMainListCoins(rates);
    const vaults = (await fetchJson<StakeDaoApiVault[]>(STAKE_DAO_VAULTS_API)).filter(v =>
      v.chainId === 1
      && v.tvl >= MIN_VAULT_TVL_USD
      && isAddress(v.vault, { strict: false })
      && isAddress(v.lpToken.address, { strict: false })
      && hasMainListCoin(v.coins, mainListCoins)
    );

    return vaults.map(v => {
      const coins = toLpCoins(v.coins, mainListCoins);
      // a lending vault supplies one coin against the other as collateral, it's not a pair
      const symbol = v.isLending ? v.name : coins.map(c => c.symbol).join('/');
      const totalApr = v.apr.current.total || 0;
      return {
        address: v.lpToken.address as `0x${string}`,
        name: v.name,
        symbol,
        project: 'Stake DAO',
        coins,
        tvl: v.tvl,
        totalApr,
        link: getStakeDaoVaultUrl(v),
        zap: {
          tokenAddress: v.vault as `0x${string}`,
          // vault shares are minted 1:1 with LP tokens
          decimals: v.lpToken.decimals,
          symbol: `${symbol} vault`,
          // the vault stakes the LP tokens and earns all the rewards for its holders
          apr: totalApr,
          price: v.lpPriceInUsd,
        },
      };
    });
  } catch (err) {
    console.error('Failed to fetch Stake DAO LPs:', err);
    return [];
  }
}
