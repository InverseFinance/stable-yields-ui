export interface SupportedToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoUri: string;
  isNative?: boolean;
  usd: number;
  price?: number;
  isIdleStable?: boolean;
  isStablish?: boolean;
  coingeckoId: string;
}

export const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as const;
export const DOLA_TOKEN_ADDRESS = '0x865377367054516e17014CcdED1e7d814EDC9ce4' as const;

export const DOLA_TOKEN = {
  address: DOLA_TOKEN_ADDRESS,
  symbol: 'DOLA',
  name: 'Dola USD Stablecoin',
  decimals: 18,
  logoUri: 'https://assets.coingecko.com/coins/images/14287/standard/dola.png?1696513984',
  isIdleStable: true,
  isStablish: true,
  coingeckoId: 'dola-usd',
};

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    isIdleStable: true,
    isStablish: true,
    coingeckoId: 'usd-coin',
  },
  DOLA_TOKEN,
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    isIdleStable: true,
    isStablish: true,
    coingeckoId: 'tether',
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    isIdleStable: true,
    isStablish: true,
    coingeckoId: 'dai',
  },
  {
    address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
    symbol: 'USDS',
    name: 'USDS Stablecoin',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/39926/standard/usds.webp?1726666683',
    isIdleStable: true,
    isStablish: true,
    coingeckoId: 'usds',
  },
  {
    address: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
    symbol: 'sUSDS',
    name: 'sUSDS Stablecoin',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/52721/standard/sUSDS_Coin.png?1734086971',
    isStablish: true,
    coingeckoId: 'susds',
  },
  {
    address: '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    symbol: 'frxUSD',
    name: 'Frax USD',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/53963/standard/frxUSD.png?1737792154',
    isIdleStable: true,
    coingeckoId: 'frax-usd',
  },
  {
    address: '0xcf62f905562626cfcdd2261162a51fd02fc9c5b6',
    symbol: 'sfrxUSD',
    name: 'Frax Staked frxUSD',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/53964/standard/sfrxUSD.png?1737792232',
    isStablish: true,
    coingeckoId: 'staked-frax-usd',
  },
  {
    address: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E',
    symbol: 'crvUSD',
    name: 'Curve.Fi USD',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/30118/small/crvusd.jpeg',
    isIdleStable: true,
    coingeckoId: 'crvusd',
  },
  {
    address: '0x0655977feb2f289a4ab78af67bab0d17aab84367',
    symbol: 'scrvUSD',
    name: 'Savings crvUSD',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/51712/standard/scrvusd.jpg?1746671018',
    isStablish: true,
    coingeckoId: 'savings-crvusd',
  },
  {
    address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    symbol: 'GHO',
    name: 'GHO',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/30663/small/gho-token-logo.png',
    isIdleStable: true,
    coingeckoId: 'gho',
  },
  {
    address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
    symbol: 'LUSD',
    name: 'Liquity USD',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/14666/small/Group_3.png',
    isIdleStable: true,
    coingeckoId: 'liquity-usd',
  },
  // {
  //   address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  //   symbol: 'sDAI',
  //   name: 'Savings DAI',
  //   decimals: 18,
  //   logoUri: 'https://assets.coingecko.com/coins/images/32254/small/sdai.png',
  //   isStablish: true,
  //   coingeckoId: 'savings-dai',
  // },
  {
    address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    symbol: 'USDe',
    name: 'Ethena USDe',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/33613/standard/usde.png?1733810059',
    isIdleStable: true,
    coingeckoId: 'ethena-usde',
  },
  {
    address: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    symbol: 'sUSDe',
    name: 'Staked USDe',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/33669/standard/sUSDe-Symbol-Color.png?1716307680',
    isStablish: true,
    coingeckoId: 'ethena-staked-usde',
  },
  {
    address: ETH_ADDRESS,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    isNative: true,
    isStablish: false,
    coingeckoId: 'ethereum',
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    coingeckoId: 'ethereum',
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoUri: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    coingeckoId: 'wrapped-bitcoin',
  },
  {
    address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    symbol: 'wstETH',
    name: 'Wrapped stETH',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/18834/small/wstETH.png',
    coingeckoId: 'wrapped-steth',
  },
  {
    address: '0x6440f144b7e50D6a8439336510312d2F54beB01D',
    symbol: 'BOLD',
    name: 'BOLD Stablecoin',
    decimals: 18,
    logoUri: 'https://assets.coingecko.com/coins/images/56069/standard/BOLD_logo.png?1748265087',
    coingeckoId: 'liquity-bold-2',
  },
];

export function isDola(address: `0x${string}`): boolean {
  return address.toLowerCase() === DOLA_TOKEN_ADDRESS.toLowerCase();
}

export function isNativeEth(address: `0x${string}`): boolean {
  return address.toLowerCase() === ETH_ADDRESS.toLowerCase();
}
