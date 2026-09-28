import { readContracts } from 'wagmi/actions';
import { LeverageData } from '@/app/types';
import { wagmiConfig } from '@/lib/wagmi';
import {
  firmAbi,
  llamalendAbi,
  morphoAbi,
  readPosition,
  toLeveragePosition,
  type CallResult,
  type LeveragePosition,
} from '@/lib/leverage-position-math';

export type { LeveragePosition };

const marketsOfKind = (markets: LeverageData[], kind: string) =>
  markets.filter(market => market.positionSource?.kind === kind);

// Leveraged positions the account holds in the listed markets
export async function fetchLeveragePositions(account: `0x${string}`, markets: LeverageData[]): Promise<LeveragePosition[]> {
  const firmMarkets = marketsOfKind(markets, 'firm');
  const llamalendMarkets = marketsOfKind(markets, 'llamalend');
  const morphoMarkets = marketsOfKind(markets, 'morpho');
  if (!firmMarkets.length && !llamalendMarkets.length && !morphoMarkets.length) return [];

  // one batch per protocol, each with its own calls
  const [firmResults, llamalendResults, morphoResults] = await Promise.all([
    firmMarkets.length ? readContracts(wagmiConfig, {
      allowFailure: true,
      contracts: firmMarkets.flatMap(market => [
        { address: market.positionSource!.contract, abi: firmAbi, functionName: 'debts' as const, args: [account] as const },
        { address: market.positionSource!.contract, abi: firmAbi, functionName: 'getCollateralValue' as const, args: [account] as const },
      ]),
    }) : [],
    llamalendMarkets.length ? readContracts(wagmiConfig, {
      allowFailure: true,
      contracts: llamalendMarkets.map(market => (
        { address: market.positionSource!.contract, abi: llamalendAbi, functionName: 'user_state' as const, args: [account] as const }
      )),
    }) : [],
    morphoMarkets.length ? readContracts(wagmiConfig, {
      allowFailure: true,
      contracts: morphoMarkets.flatMap(market => [
        { address: market.positionSource!.contract, abi: morphoAbi, functionName: 'position' as const, args: [market.positionSource!.marketId!, account] as const },
        { address: market.positionSource!.contract, abi: morphoAbi, functionName: 'market' as const, args: [market.positionSource!.marketId!] as const },
      ]),
    }) : [],
  ]);

  const toPositions = (kindMarkets: LeverageData[], results: unknown[], callsPerMarket: number) =>
    kindMarkets.flatMap((market, index) => {
      const { deposits, debt } = readPosition(market, results.slice(index * callsPerMarket, (index + 1) * callsPerMarket) as CallResult[]);
      const position = toLeveragePosition(market, deposits, debt);
      return position ? [position] : [];
    });

  return [
    ...toPositions(firmMarkets, firmResults, 2),
    ...toPositions(llamalendMarkets, llamalendResults, 1),
    ...toPositions(morphoMarkets, morphoResults, 2),
  ];
}
