// Ethena sats multipliers, read from https://app.ethena.fi/opportunities on 2026-09-28.
// The page holds them in its client bundle with no API behind it, so they live here
// and are refreshed with `npm run refresh-ethena-points`.

// Venues, keyed by the venue and the collateral symbols, all lowercased
const MARKET_MULTIPLIERS: Record<string, number> = {
  'ether.fi ether.fi:liquid': 20, // ETHER.FI Ether.fi Liquid
  'curve:dola+susde': 30, // CURVE sUSDe • DOLA
  'curve:sdai+susde': 30, // CURVE sUSDe • sDAI
  'curve:reusd+susde': 30, // CURVE reUSD • sUSDe
  'curve:scrvusd+susde': 30, // CURVE sUSDe • scrvUSD
  'curve:usde+usdt': 30, // CURVE USDe • USDT
  'curve:susd+susde': 30, // CURVE sUSDe • sUSD
  'curve:usdc+usde': 30, // CURVE USDe • USDC
  'curve:susde+susds': 30, // CURVE sUSDe • sUSDs
  'curve:gho+usde': 30, // CURVE USDe • GHO
  'uniswap:usde+usdt': 30, // UNISWAP USDe • USDT
  'curve:ousd+usde': 30, // CURVE USDe • OUSD
  'curve:feusd+usde': 30, // CURVE USDe • feUSD
  'curve:usde+usdtb': 30, // CURVE USDe • USDtb
  'curve:usde+usdx': 30, // CURVE USDe • USDX
  'curve:usde+ush': 30, // CURVE USDe • USH
  'curve:frxusd+usde': 30, // CURVE USDe • frxUSD
  'curve:susde+usde': 30, // CURVE sUSDe • USDe
  'curve:susd+usde': 30, // CURVE USDe • sUSD
  'curve:fdusd+usde': 30, // CURVE USDe • FDUSD
  'curve:musd+susde': 30, // CURVE MUSD • sUSDe
  'infinitypools:susde+usdc': 30, // INFINITYPOOLS sUSDe • USDC
  'infinitypools:susde+wsteth': 30, // INFINITYPOOLS sUSDe • wstETH
  'curve:frax+susde': 30, // CURVE sUSDe • FRAX
  'curve:frax+usde': 30, // CURVE USDe • FRAX
  'curve:usde+usdt0': 30, // CURVE USDe • USDT0
  'curve:susde+usdt0': 30, // CURVE sUSDe • USDT0
  'curve:feusd+susde': 30, // CURVE sUSDe • feUSD
  'aura finance:gho+usde': 30, // AURA FINANCE USDe • GHO
  'balancer:frax+usde': 30, // BALANCER USDe • FRAX
  'balancer:usde+wagho': 30, // BALANCER USDe • waGHO
  'balancer:usde+usdt': 30, // BALANCER USDe • USDT
  'balancer:siusd+susde': 30, // BALANCER sUSDe • siUSD
  'balancer:gyd+susde': 30, // BALANCER sUSDe • GYD
  'balancer:sdai+sfrax+susde': 30, // BALANCER sUSDe • sDAI • sFRAX
  'balancer:sfrax+susde': 30, // BALANCER sUSDe • sFRAX
  'balancer:susde+usdc': 30, // BALANCER sUSDe • USDC
  'beefy:crvusd+susde': 30, // BEEFY sUSDe • crvUSD
  'beefy:sfrax+susde': 30, // BEEFY sUSDe • sFRAX
  'beefy:susde+usdc': 30, // BEEFY sUSDe • USDC
  'beefy:gyd+susde': 30, // BEEFY sUSDe • GYD
  'beefy:usdc+usde': 30, // BEEFY USDe • USDC
  'beefy:usde+usdt': 30, // BEEFY USDe • USDT
  'beefy:usde+usdx': 30, // BEEFY USDe • USDX
  'polynomial:susde': 5, // POLYNOMIAL sUSDe
  'silo finance:susde': 5, // SILO FINANCE sUSDe
  'aave:usde': 5, // AAVE USDe
  'aave:susde': 5, // AAVE sUSDe
  'morpho:reusd': 20, // MORPHO reUSD
  'derive - susdebull vault:susde': 5, // DERIVE - SUSDEBULL VAULT sUSDe
  'morpho:susde': 5, // MORPHO sUSDe
  'meridian - liquidity provider vault:usde': 30, // MERIDIAN - LIQUIDITY PROVIDER VAULT USDe
  'contango:susde': 5, // CONTANGO sUSDe
  'morpho:usde': 25, // MORPHO USDe
  'frax:susde': 5, // FRAX sUSDe
  'aave - lido:susde': 5, // AAVE - LIDO sUSDe
  'morpho:jrusde': 10, // MORPHO jrUSDe
  'contango:usde': 20, // CONTANGO USDe
  'frax:usde': 20, // FRAX USDe
  'derive - exchange collateral:susde': 5, // DERIVE - EXCHANGE COLLATERAL sUSDe
  'derive - exchange collateral:usde': 20, // DERIVE - EXCHANGE COLLATERAL USDe
  'fluid:susde+usdc': 5, // FLUID sUSDe • USDC
  'fluid:susde+usdt': 5, // FLUID sUSDe • USDT
  'fluid:gho+susde': 5, // FLUID sUSDe • GHO
  'fluid:susde+usdc+usdt': 30, // FLUID sUSDe • USDC • USDT
  'fluid:susde+usdt+usdt': 30, // FLUID sUSDe • USDT • USDT
  'fluid:usde+usdt+usdt': 30, // FLUID USDe • USDT • USDT
  'fluid:gho+susde+usdc': 30, // FLUID sUSDe • GHO • USDC
  'fluid vault #127:usdc+usde+usdt': 30, // FLUID VAULT #127 USDe • USDC • USDT
  'fluid vault #99:usdc+usde+usdt': 30, // FLUID VAULT #99 USDe • USDC • USDT
  'fluid smart lending:iusd+usde': 30, // FLUID SMART LENDING USDe • iUSD
  'fluid smart lending:srusde+usde': 30, // FLUID SMART LENDING srUSDe • USDe
  'fluid smart lending:jrusde+usde': 30, // FLUID SMART LENDING USDe • jrUSDe
  'fluid:gho+usde': 30, // FLUID USDe • GHO
  'fluid:usde+usdt+usdtb': 30, // FLUID USDe • USDtb • USDT
  'fluid:usdc+usde+usdtb': 30, // FLUID USDe • USDtb • USDC
  'fluid:gho+usde+usdtb': 30, // FLUID USDe • USDtb • GHO
  'fluid arbitrum vault 56#:susde+usdc': 5, // FLUID ARBITRUM VAULT 56# sUSDe • USDC
  'fluid arbitrum vault 57#:susde+usdt': 5, // FLUID ARBITRUM VAULT 57# sUSDe • USDT
  'fluid arbitrum vault 58#:gho+susde': 5, // FLUID ARBITRUM VAULT 58# sUSDe • GHO
  'fluid arbitrum vault 59#:susde+usdc+usdt': 5, // FLUID ARBITRUM VAULT 59# sUSDe • USDC • USDT
  'fluid arbitrum vault 60#:susde+usdt+usdt': 30, // FLUID ARBITRUM VAULT 60# sUSDe • USDT • USDT
  'fluid arbitrum vault 61#:susde+usdc+usdt': 30, // FLUID ARBITRUM VAULT 61# sUSDe • USDT • USDC
  'fluid arbitrum vault 62#:gho+usde': 30, // FLUID ARBITRUM VAULT 62# USDe • GHO
  'fluid arbitrum vault 54#:usde+usdt': 30, // FLUID ARBITRUM VAULT 54# USDe • USDT
  'fluid arbitrum vault 55#:usdc+usde+usdt': 30, // FLUID ARBITRUM VAULT 55# USDe • USDC • USDT
  'fluid plasma vault #4:susde+usdt0': 5, // FLUID PLASMA VAULT #4 sUSDe • USDT0
  'gearbox:usde': 20, // GEARBOX USDe
  'gearbox:susde': 5, // GEARBOX sUSDe
  'gearbox:llamathena': 30, // GEARBOX LlamaThena
  'gearbox:usde+usdt0': 30, // GEARBOX USDe • USDT0
  'gearbox:susde+usdt0': 30, // GEARBOX sUSDe • USDT0
  'notional:usdc': 20, // NOTIONAL USDC
  'notional:gho': 20, // NOTIONAL GHO
  'llamalend:usde': 20, // LLAMALEND USDe
  'llamalend:susde': 5, // LLAMALEND sUSDe
  'inverse:susde': 5, // INVERSE sUSDe
  'allstake:usde': 20, // ALLSTAKE USDe
  'allstake:susde': 5, // ALLSTAKE sUSDe
  'zerolend:usde': 20, // ZEROLEND USDe
  'zerolend:susde': 5, // ZEROLEND sUSDe
  'venus:susde': 5, // VENUS sUSDe
  'venus:usde': 20, // VENUS USDe
  'compound:usde': 20, // COMPOUND USDe
  'cork:susds+usde': 20, // CORK USDe • sUSDS
  'cork:susde+usdt': 5, // CORK sUSDe • USDT
  'term finance:susde': 5, // TERM FINANCE sUSDe
  'euler:usde': 5, // EULER USDe
  'euler:susde': 5, // EULER sUSDe
  'euler k3 capital cluster:usde+usdt': 20, // EULER K3 CAPITAL CLUSTER USDe • USDT
  'euler tulipa:usde+usdt': 20, // EULER TULIPA USDe • USDT
  'euler k3 capital cluster:susde+usdt': 5, // EULER K3 CAPITAL CLUSTER sUSDe • USDT
  'euler tulipa:susde+usdt': 5, // EULER TULIPA sUSDe • USDT
  'euler apostro:usde+usdt': 20, // EULER APOSTRO USDe • USDT
  'euler apostro:susde+usdt': 5, // EULER APOSTRO sUSDe • USDT
  'hyperlend:usde': 20, // HYPERLEND USDe
  'hyperlend:susde': 5, // HYPERLEND sUSDe
  'sentiment:usde': 20, // SENTIMENT USDe
  'lista:usde': 20, // LISTA USDe
  'lista:susde': 5, // LISTA sUSDe
  'inverse:dola+susde': 30, // INVERSE sUSDe • DOLA
  'inverse yearn vault:dola+susde': 30, // INVERSE YEARN VAULT sUSDe • DOLA
  'hyperdrive:usde': 20, // HYPERDRIVE USDe
  'infinifi:iusd': 2, // INFINIFI iUSD
  'infinifi:siusd': 5, // INFINIFI siUSD
  'infinifi:liusd': 5, // INFINIFI liUSD
  'strata predeposit:pusde': 30, // STRATA PREDEPOSIT pUSDe
  'strata:srusde': 40, // STRATA srUSDe
  'strata:jrusde': 10, // STRATA jrUSDe
  'felix:usde': 20, // FELIX USDe
  'euler strata frontier:usde': 30, // EULER STRATA FRONTIER USDe
  'euler strata frontier:pusde': 30, // EULER STRATA FRONTIER pUSDe
  'euler strata frontier:jrusde': 5, // EULER STRATA FRONTIER jrUSDe
  'euler strata frontier:srusde': 30, // EULER STRATA FRONTIER srUSDe
  'wildcat auros:usde': 30, // WILDCAT AUROS USDe
  'wildcat hyperithm:usde': 30, // WILDCAT HYPERITHM USDe
  'wildcat kappa lab:usde': 30, // WILDCAT KAPPA LAB USDe
};

// Liquidity pools, keyed by their coin symbols, for an LP token wherever it is held
const POOL_MULTIPLIERS: Record<string, number> = {
  'dola+susde': 30, // CURVE sUSDe • DOLA
  'sdai+susde': 30, // CURVE sUSDe • sDAI
  'reusd+susde': 30, // CURVE reUSD • sUSDe
  'scrvusd+susde': 30, // CURVE sUSDe • scrvUSD
  'usde+usdt': 30, // CURVE USDe • USDT
  'susd+susde': 30, // CURVE sUSDe • sUSD
  'usdc+usde': 30, // CURVE USDe • USDC
  'susde+susds': 30, // CURVE sUSDe • sUSDs
  'gho+usde': 30, // CURVE USDe • GHO
  'ousd+usde': 30, // CURVE USDe • OUSD
  'feusd+usde': 30, // CURVE USDe • feUSD
  'usde+usdtb': 30, // CURVE USDe • USDtb
  'usde+usdx': 30, // CURVE USDe • USDX
  'usde+ush': 30, // CURVE USDe • USH
  'frxusd+usde': 30, // CURVE USDe • frxUSD
  'susde+usde': 30, // CURVE sUSDe • USDe
  'susd+usde': 30, // CURVE USDe • sUSD
  'fdusd+usde': 30, // CURVE USDe • FDUSD
  'musd+susde': 30, // CURVE MUSD • sUSDe
  'susde+usdc': 30, // INFINITYPOOLS sUSDe • USDC
  'susde+wsteth': 30, // INFINITYPOOLS sUSDe • wstETH
  'frax+susde': 30, // CURVE sUSDe • FRAX
  'frax+usde': 30, // CURVE USDe • FRAX
  'usde+usdt0': 30, // CURVE USDe • USDT0
  'susde+usdt0': 30, // CURVE sUSDe • USDT0
  'feusd+susde': 30, // CURVE sUSDe • feUSD
  'usde+wagho': 30, // BALANCER USDe • waGHO
  'siusd+susde': 30, // BALANCER sUSDe • siUSD
  'gyd+susde': 30, // BALANCER sUSDe • GYD
  'sdai+sfrax+susde': 30, // BALANCER sUSDe • sDAI • sFRAX
  'sfrax+susde': 30, // BALANCER sUSDe • sFRAX
  'crvusd+susde': 30, // BEEFY sUSDe • crvUSD
};

// our project names, where they differ from Ethena's
const PROJECT_ALIASES: Record<string, string> = {
  firm: 'inverse',
};

// Sats per dollar of collateral, undefined when the collateral earns none
export function getEthenaMultiplier(project: string, coinSymbols: string[]): number | undefined {
  // ethena program ending
  return 0;
  const coinsKey = coinSymbols.map(symbol => symbol.toLowerCase()).sort().join('+');
  const projectKey = project.toLowerCase();
  return MARKET_MULTIPLIERS[`${PROJECT_ALIASES[projectKey] || projectKey}:${coinsKey}`]
    // an LP earns the points of its pool, whichever venue holds the LP token
    ?? POOL_MULTIPLIERS[coinsKey];
}
