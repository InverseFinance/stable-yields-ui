import { EnsoClient } from '@ensofinance/sdk';
import { SDOLA_ADDRESS } from '@/lib/contracts';

// fee receiver contract, sweeps go to Inverse Treasury address
export const FEE_RECEIVER = '0x8dF2fBeBc0fe876e4001b9E89361C5aE02d663d2';
export const FEE_BPS = 10;

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
// the API key allows about one request per second
const MIN_REQUEST_INTERVAL_MS = 1100;

let nextRequestAt = 0;

// Spaces out the Enso requests of this runtime, so concurrent ones don't get rate limited
function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const startAt = Math.max(now, nextRequestAt);
  nextRequestAt = startAt + MIN_REQUEST_INTERVAL_MS;
  return new Promise(resolve => setTimeout(resolve, startAt - now)).then(fn);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await scheduleRequest(fn);
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
    fee: [FEE_BPS],
    feeReceiver: FEE_RECEIVER,
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

export async function fetchEnsoPrices(addresses: `0x${string}`[]) {
  const enso = getClient();
  return withRetry(() => enso.getMultiplePriceData({
    chainId: 1,
    addresses,
  }));
}

export async function fetchEnsoTokensData(addresses: `0x${string}`[]) {
  const enso = getClient();
  return withRetry(() => enso.getTokenData({
    chainId: 1,
    address: addresses,
    includeMetadata: true,
    includeUnderlying: true,
  }));
}

// components loading the balances at the same time (e.g. on wallet connect) share the request
const BALANCES_REUSE_MS = 5_000;
const balanceRequests = new Map<string, { promise: ReturnType<EnsoClient['getBalances']>; startedAt: number }>();

export function fetchEnsoBalances(address: `0x${string}`) {
  const key = address.toLowerCase();
  const recent = balanceRequests.get(key);
  if (recent && Date.now() - recent.startedAt < BALANCES_REUSE_MS) return recent.promise;

  const enso = getClient();
  const promise = withRetry(() => enso.getBalances({
    chainId: 1,
    eoaAddress: address,
    useEoa: true,
  }));
  balanceRequests.set(key, { promise, startedAt: Date.now() });
  promise.catch(() => balanceRequests.delete(key));
  return promise;
}
