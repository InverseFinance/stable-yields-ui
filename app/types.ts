export interface YieldData {
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