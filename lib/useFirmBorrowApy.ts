'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'firm-borrow-apy';

// The fixed rate a FiRM borrower locked in, which differs from the market's current one,
// kept in the browser so it applies to every FiRM position on the next visits too.
export function useFirmBorrowApy(): [number | undefined, (borrowApy: number | undefined) => void] {
  const [borrowApy, setBorrowApy] = useState<number>();

  // read after mounting, the server render has no storage
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY));
      if (Number.isFinite(stored) && stored > 0) setBorrowApy(stored);
    } catch {
      // storage can be unavailable, the market rate then stands
    }
  }, []);

  const save = useCallback((rate: number | undefined) => {
    setBorrowApy(rate);
    try {
      if (rate && Number.isFinite(rate) && rate > 0) window.localStorage.setItem(STORAGE_KEY, String(rate));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // the rate still applies for this visit
    }
  }, []);

  return [borrowApy, save];
}
