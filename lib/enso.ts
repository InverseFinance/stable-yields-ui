import { EnsoClient } from '@ensofinance/sdk';
import { SDOLA_ADDRESS } from '@/lib/contracts';

let client: EnsoClient | null = null;

function getClient(): EnsoClient {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_ENSO_API_KEY;
    if (!apiKey) throw new Error('NEXT_PUBLIC_ENSO_API_KEY is not set');
    client = new EnsoClient({ apiKey });
  }
  return client;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  throw lastError;
}

export async function fetchEnsoRoute(params: {
  fromAddress: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut?: `0x${string}`;
  amountIn: string;
  slippage?: string;
}) {
  const enso = getClient();
  return withRetry(() => enso.getRouteData({
    chainId: 1,
    fromAddress: params.fromAddress,
    receiver: params.fromAddress,
    routingStrategy: 'router',
    tokenIn: [params.tokenIn],
    tokenOut: [params.tokenOut ?? SDOLA_ADDRESS],
    amountIn: [params.amountIn],
    slippage: params.slippage ?? '10',
  }));
}

export async function fetchEnsoApproval(params: {
  fromAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: string;
}) {
  const enso = getClient();
  return withRetry(() => enso.getApprovalData({
    fromAddress: params.fromAddress,
    tokenAddress: params.tokenAddress,
    chainId: 1,
    amount: params.amount,
  }));
}

export async function fetchEnsoBalances(address: `0x${string}`) {
  const enso = getClient();
  return withRetry(() => enso.getBalances({
    chainId: 1,
    eoaAddress: address,
    useEoa: true,
  }));
}
