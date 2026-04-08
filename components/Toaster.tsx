'use client';

import { useSyncExternalStore, useState, useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { getToasts, subscribeToasts, removeTxToast, type TxToastEntry } from '@/lib/toastStore';

const ETHERSCAN_TX = 'https://etherscan.io/tx/';
const AUTO_DISMISS_MS = 8000;

function TxToast({ hash, description }: TxToastEntry) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({ hash });
  const [exiting, setExiting] = useState(false);

  const isDone = isSuccess || isError;

  useEffect(() => {
    if (!isDone) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => removeTxToast(hash), 300);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [isDone, hash]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => removeTxToast(hash), 300);
  }

  const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  const borderColor = isSuccess
    ? 'border-l-success'
    : isError
      ? 'border-l-red-500'
      : 'border-l-accent';

  return (
    <div
      className={`
        flex items-start gap-3 bg-card-bg border border-white/[0.07] border-l-2 ${borderColor}
        rounded-xl px-4 py-3 shadow-2xl min-w-[270px] max-w-[320px]
        transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Status icon */}
      <div className="pt-0.5 shrink-0 w-4">
        {isSuccess ? (
          <span className="text-success text-sm leading-none font-bold">✓</span>
        ) : isError ? (
          <span className="text-red-400 text-sm leading-none font-bold">✕</span>
        ) : (
          <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-[13px] leading-snug">{description}</p>
        <p className="text-text-muted text-[11px] mt-0.5">
          {isSuccess ? 'Confirmed' : isError ? 'Failed' : isLoading ? 'Confirming...' : 'Submitted'}
        </p>
        <a
          href={`${ETHERSCAN_TX}${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent/80 text-[11px] font-mono transition-colors duration-150"
        >
          {shortHash} ↗
        </a>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        className="text-text-muted hover:text-text-secondary transition-colors duration-150 text-lg leading-none mt-[-2px] shrink-0 cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.hash} className="pointer-events-auto">
          <TxToast {...t} />
        </div>
      ))}
    </div>
  );
}
