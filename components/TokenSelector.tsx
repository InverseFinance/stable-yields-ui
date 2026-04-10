'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SupportedToken } from '@/lib/tokens';
import { formatUsd, smartShortNumber } from '@/lib/utils';
import Image from 'next/image';

export interface TokenMeta {
  apy?: number;
  tvl?: number;
}

interface TokenSelectorProps {
  tokens: SupportedToken[];
  selected: SupportedToken;
  type?: 'vaultExit';
  onSelect: (token: SupportedToken) => void;
  balances?: Record<string, string>;
  metadata?: Record<string, TokenMeta>; // keyed by lowercase address
}

export function TokenSelector({ tokens, type, selected, onSelect, balances, metadata }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = tokens.filter(t => {
    const r = new RegExp(search, 'i');
    return r.test(t.symbol) || r.test(t.name);
  });

  function openDropdown() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close when something outside the dropdown scrolls (so the dropdown doesn't drift)
  useEffect(() => {
    if (!open) return;
    function handleScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [open]);

  const dropdown = open && (
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
      className="w-64 max-h-80 overflow-y-auto bg-card-bg border border-white/[0.07] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl flex flex-col"
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            autoFocus
            className="w-full bg-surface border border-white/[0.05] rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent/30 transition-colors"
            placeholder="Search token..."
            name="tokenSearch"
            value={search}
            onChange={v => setSearch(v.target.value)}
          />
        </div>
      </div>

      {/* Token list */}
      <div className="overflow-y-auto">
        {filtered.map((token, i) => (
          <button
            key={token.address}
            onClick={() => { onSelect(token); setOpen(false); setSearch(''); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 ${
              token.address === selected.address ? 'bg-accent/[0.08]' : 'hover:bg-white/[0.03]'
            } ${i > 0 ? 'border-t border-white/[0.03]' : ''}`}
          >
            <Image src={token.logoUri} alt={token.symbol} width={28} height={28} className="rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{token.symbol}</div>
              <div className="text-xs text-muted-foreground truncate">{token.name}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {type !== 'vaultExit' && metadata?.[token.address.toLowerCase()]?.apy != null && (
                <span className="text-xs font-medium text-green-400">
                  {metadata[token.address.toLowerCase()].apy!.toFixed(2)}% APY
                </span>
              )}
              {type !== 'vaultExit' && metadata?.[token.address.toLowerCase()]?.tvl != null && (
                <div className="text-xs text-muted-foreground">
                  {smartShortNumber(metadata[token.address.toLowerCase()].tvl!, 1, true)} TVL
                </div>
              )}
              {balances?.[token.address.toLowerCase()] && (
                <>
                  <span className="text-xs font-mono text-text-secondary">
                    {balances[token.address.toLowerCase()]}
                  </span>
                  {token.usd ? (
                    <span className="text-xs font-mono text-text-muted">
                      {token.usd < 1 ? '<$1' : formatUsd(token.usd)}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative shrink-0">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={openDropdown}
        className="flex cursor-pointer items-center gap-2 bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.07] rounded-xl px-3 py-2 transition-all duration-150"
      >
        <Image src={selected.logoUri} alt={selected.symbol} width={20} height={20} className="rounded-full" />
        <span className="text-sm font-semibold text-foreground">{selected.symbol}</span>
        <svg
          className={`w-3 h-3 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown rendered in portal to escape overflow clipping */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
