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
    pool?: string;
    vaultPrice: number;
    totalAssets: number;
    totalAssets30d: number;
    totalAssets90d: number;
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