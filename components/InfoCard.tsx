'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

// Card of the supply modals, in the frame the zap card takes when a zap is available
export function InfoCard({
  title,
  image,
  imageAlt,
  stats,
  message,
}: {
  title: ReactNode;
  image: string;
  imageAlt: string;
  stats: { label: string; value: ReactNode }[];
  message: string;
}) {
  return (
    <div className="card-shine relative bg-container border border-white/[0.05] rounded-2xl">
      <div className="relative flex justify-center border-b border-white/[0.05] py-3.5 text-sm font-medium tracking-wide text-foreground">
        <span className="flex flex-row items-center gap-1">
          {title}
          <Image src={image} alt={imageAlt} width={20} height={20} />
        </span>
        <span className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-3">
        <div className="bg-surface/50 border border-white/[0.04] rounded-xl p-4 space-y-2 text-sm">
          {stats.map(stat => (
            <div key={stat.label} className="flex justify-between">
              <span className="text-text-muted">{stat.label}</span>
              <span className="font-mono text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-center text-xs sm:text-sm">{message}</p>
      </div>
    </div>
  );
}
