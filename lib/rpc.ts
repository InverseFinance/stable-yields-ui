import { createPublicClient, fallback, http } from 'viem';
import { mainnet } from 'viem/chains';

// Server-side Ethereum reads, concurrent calls are batched into multicalls
export const publicClient = createPublicClient({
  chain: mainnet,
  batch: { multicall: true },
  transport: fallback([
    ...(process.env.RPC_URL ? [http(process.env.RPC_URL)] : []),
    http(),
    http('https://ethereum-rpc.publicnode.com'),
  ]),
});
