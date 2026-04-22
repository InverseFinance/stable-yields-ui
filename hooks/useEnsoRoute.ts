import { useState, useEffect, useRef } from 'react';
import { fetchEnsoRoute } from '@/lib/enso';
import { isDola } from '@/lib/tokens';
import { SDOLA_ADDRESS } from '@/lib/contracts';

const STALE_AFTER_MS = 60_000;
const CHECK_INTERVAL_MS = 5_000;

interface EnsoRouteResult {
  amountOut: string | null;
  tx: { data: string; to: string; from: string; value: string } | null;
  gas: string | null;
  priceImpact: string | number | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY: EnsoRouteResult = {
  amountOut: null,
  tx: null,
  gas: null,
  priceImpact: null,
  isLoading: false,
  error: null,
};

export function useEnsoRoute(
  tokenIn: `0x${string}` | undefined,
  amountInWei: string,
  fromAddress: `0x${string}` | undefined,
  slippage: string,
  tokenOut?: `0x${string}`,
  canAutoRefresh?: boolean,
): EnsoRouteResult {
  const [result, setResult] = useState<EnsoRouteResult>(EMPTY);
  const abortRef = useRef(0);
  const fetchedAtRef = useRef<number>(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (!tokenIn || !fromAddress || amountInWei === '0' || amountInWei === '') {
      setResult(EMPTY);
      fetchedAtRef.current = 0;
      return;
    }

    const id = ++abortRef.current;
    setResult(prev => ({ ...prev, isLoading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const route = await fetchEnsoRoute({
          fromAddress,
          tokenIn,
          tokenOut,
          amountIn: amountInWei,
          slippage,
        });
        if (abortRef.current !== id) return;
        fetchedAtRef.current = Date.now();
        setResult({
          amountOut: String(route.amountOut),
          tx: {
            data: String(route.tx.data),
            to: String(route.tx.to),
            from: String(route.tx.from),
            value: String(route.tx.value),
          },
          gas: String(route.gas),
          priceImpact: route.priceImpact,
          isLoading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (abortRef.current !== id) return;
        fetchedAtRef.current = 0;
        setResult({
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Failed to fetch route',
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tokenIn, amountInWei, fromAddress, slippage, tokenOut, refreshCounter]);

  // Auto-refresh stale routes
  useEffect(() => {
    if (!canAutoRefresh) return;
    const interval = setInterval(() => {
      if (fetchedAtRef.current > 0 && Date.now() - fetchedAtRef.current >= STALE_AFTER_MS) {
        setRefreshCounter(c => c + 1);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [canAutoRefresh]);

  return result;
}
