'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { ETHENA_ICON } from '@/lib/leverage';
import { Tooltip } from './Tooltip';

export const formatPoints = (multiplier: number) => `${Math.round(multiplier).toLocaleString('en-US')}x`;

// Ethena sats multiplier, the wording living in the tooltip
export function PointsPill({ multiplier, tooltip }: { multiplier: number; tooltip: ReactNode }) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap">
        <Image className="rounded-full w-3 h-3" src={ETHENA_ICON} alt="Ethena" width={12} height={12} />
        {formatPoints(multiplier)}
      </span>
    </Tooltip>
  );
}
