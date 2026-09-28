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

export interface LpToken {
    address: `0x${string}`;
    decimals: number;
    symbol: string;
    // APR earned by holding the token
    apr: number;
    // USD price of one token
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
    // token received when zapping in with Enso, only for projects supporting the Enso zap-in
    zap?: LpToken;
    // token held by depositors, to find and value their positions
    position?: LpToken;
}

export interface LeverageCollateral {
    symbol: string;
    // the token itself, or the coins of an LP
    coins: LpCoin[];
}

export interface LeveragePositionSource {
    // shape of the calls reading a user position
    kind: 'firm' | 'llamalend' | 'morpho';
    // FiRM market, Llamalend controller, or the Morpho Blue singleton
    contract: `0x${string}`;
    // Morpho market id
    marketId?: `0x${string}`;
    collateralDecimals: number;
    debtDecimals: number;
    // USD price of one collateral token, unset when the contract reports a USD value
    collateralPrice?: number;
    // price of the collateral in the Stables list, preferred so a position matches the rest of the app
    collateralVaultPrice?: number;
    // price the market itself puts on the collateral, to turn a USD value back into an amount
    oraclePrice?: number;
}

export interface LeverageData {
    // market identifier of the project, a controller address or a market id
    id: string;
    name: string;
    project: string;
    // version of the market, when the project has several of them for a same collateral
    version?: number;
    collateral: LeverageCollateral;
    debt: LpCoin;
    // set when the borrow rate is fixed instead of floating
    fixedBorrowRate?: boolean;
    // borrowable amount left in the market, in USD
    liquidity: number;
    // share of the supplied assets currently borrowed in %, unset for the CDP markets that have none
    utilization?: number;
    // highest leverage the market's max LTV allows
    maxLeverage: number;
    maxLtv: number;
    // APY of the collateral in the main list
    collateralApy: number;
    // Ethena sats per dollar of collateral, when it earns some
    pointsMultiplier?: number;
    borrowApy: number;
    // net APY of a position at the max leverage
    maxNetApy: number;
    link: string;
    positionSource?: LeveragePositionSource;
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