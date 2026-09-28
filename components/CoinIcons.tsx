'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LpCoin } from '@/app/types';

function CoinIcon({ coin, sizeClassName }: { coin: LpCoin; sizeClassName: string }) {
  const [hasError, setHasError] = useState(false);
  const className = `rounded-full ${sizeClassName} ring-2 ring-card shrink-0`;

  if (hasError) {
    return (
      <span className={`${className} bg-muted text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center`}>
        {coin.symbol.slice(0, 1)}
      </span>
    );
  }
  return (
    <Image
      className={className}
      src={coin.image}
      alt={coin.symbol}
      width={32}
      height={32}
      onError={() => setHasError(true)}
    />
  );
}

// Overlapping icons of the pool's coins
export function LpCoinIcons({ coins, sizeClassName = 'w-5 h-5 sm:w-7 sm:h-7' }: { coins: LpCoin[]; sizeClassName?: string }) {
  return (
    <div className="flex -space-x-2 shrink-0">
      {coins.map(coin => <CoinIcon key={coin.address} coin={coin} sizeClassName={sizeClassName} />)}
    </div>
  );
}
