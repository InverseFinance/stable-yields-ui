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

export interface LpData {
    // LP token address
    address: `0x${string}`;
    decimals: number;
    name: string;
    symbol: string;
    project: string;
    coins: LpCoin[];
    tvl: number;
    baseApr: number;
    // gauge rewards and incentives, only earned when staking the LP token
    rewardsApr: number;
    totalApr: number;
    lpPrice?: number;
    link: string;
    // zappable with Enso, otherwise only the project link is offered
    isZappable: boolean;
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