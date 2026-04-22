'use client';

import { useState, useEffect, useRef } from 'react';

export type SlippageSetting = 'auto' | '2' | '3' | '5' | '10' | '50' | '100';

export const SLIPPAGE_OPTIONS: { value: Exclude<SlippageSetting, 'auto'>; label: string }[] = [
  { value: '2', label: '0.02%' },
  { value: '3', label: '0.03%' },
  { value: '5', label: '0.05%' },
  { value: '10', label: '0.1%' },
  { value: '50', label: '0.5%' },
  { value: '100', label: '1%' },
];

export function SlippageSelector({
  value,
  onChange,
  label,
}: {
  value: SlippageSetting;
  onChange: (v: SlippageSetting) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(s => !s)}
        className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        title="Slippage settings"
      >
        {value !== 'auto' && (
          <span className="text-[11px] font-mono text-accent">
            {SLIPPAGE_OPTIONS.find(o => o.value === value)?.label}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 bg-container border border-white/[0.08] rounded-xl p-3 shadow-xl w-64">
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium mb-2.5">
            {label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onChange('auto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${value === 'auto'
                ? 'bg-accent text-[#1A0E00]'
                : 'bg-white/[0.05] text-text-muted hover:text-text-secondary border border-white/[0.06]'
                }`}
            >
              Auto
            </button>
            {SLIPPAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${value === opt.value
                  ? 'bg-accent text-[#1A0E00]'
                  : 'bg-white/[0.05] text-text-muted hover:text-text-secondary border border-white/[0.06]'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
