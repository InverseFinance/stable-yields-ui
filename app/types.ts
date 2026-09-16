export interface StakingData {
    symbol: string;
    project: string;
    apy: number;
    avg30: number;
    avg60: number;
    avg90: number;
    tvl: number;
    link: string;
    image: string;
    isVault?: boolean;
    isLp?: boolean;
    pool?: string;
    vaultPrice: number;
    totalAssets: number;
    totalAssets30d: number;
    totalAssets90d: number;
    decimals: number;
    zapDecimals: number;
    zapSymbol?: string;
    zapAddress?: string;
    address?: string;
    name?: string;
    logoUri?: string;
}

export interface LpCoin {
    address: string;
    symbol: string;
    image: string;
}

export interface LpZap {
    // token received when zapping in with Enso
    tokenAddress: `0x${string}`;
    decimals: number;
    symbol: string;
    // APR earned by holding the received token
    apr: number;
    // needed by the zap card to compare output worth with deposit worth
    price?: number;
}

export interface LpData {
    // LP token address
    address: `0x${string}`;
    name: string;
    symbol: string;
    project: string;
    coins: LpCoin[];
    tvl: number;
    totalApr: number;
    link: string;
    // only for projects supporting the Enso zap-in
    zap?: LpZap;
}

export interface ChartData {
    symbol: string;
    project: string;
    chartData: {
        timestamp: string;
        apy: number;
        tvlUsd: number;
    }[];
}