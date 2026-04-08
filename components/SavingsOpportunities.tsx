'use client';

import { useState } from 'react';
import { SupportedToken } from "@/lib/tokens"
import { formatUsd, formatApy, formatTokenAmount } from '@/lib/utils';
import { useLanguage } from '@/lib/useLanguage';
import Image from 'next/image';

export const estimateOppurtunities = ({
    apy,
    totalAssets,
    tokens,
    dolaPriceUsd,
}: {
    tokens: SupportedToken[];
    apy: number;
    totalAssets: number;
    dolaPriceUsd: number;
}) => {
    const totalIldeUsd = tokens.filter(t => t.isIdleStable).reduce((prev, curr) => prev + (curr.usd || 0), 0);
    const newTotalAssetsIfInvested = totalAssets + (dolaPriceUsd ? totalIldeUsd / dolaPriceUsd : totalIldeUsd);
    const estimatedNewApy = newTotalAssetsIfInvested ? apy * (totalAssets / newTotalAssetsIfInvested) : 0;
    const estimatedYearlyGain = estimatedNewApy / 100 * totalIldeUsd;

    return {
        estimatedNewApy,
        totalIldeUsd,
        newTotalAssetsIfInvested,
        estimatedYearlyGain,
    }
}

export const SavingsOpportunites = ({
    apy,
    totalAssets,
    tokens,
    dolaPriceUsd = 1,
    onSelectToken,
}: {
    tokens: SupportedToken[];
    apy: number;
    totalAssets: number;
    dolaPriceUsd?: number;
    onSelectToken?: (token: SupportedToken) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const { t } = useLanguage();
    const { estimatedNewApy, totalIldeUsd, estimatedYearlyGain } = estimateOppurtunities({ apy, totalAssets, tokens, dolaPriceUsd });

    if (totalIldeUsd <= 0) return null;

    const idleTokens = tokens.filter(tok => tok.isIdleStable && tok.usd >= 1);

    return (
        <div className="mb-1">
            {/* Header row */}
            {
                totalIldeUsd > 1 && <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-accent/[0.09] transition-colors duration-150"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-text-secondary text-xs whitespace-nowrap">
                            {t.yourIdleStables}{' '}
                            <span className="text-foreground font-mono font-medium">{formatUsd(totalIldeUsd)}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-success font-mono font-semibold text-xs">
                            {t.youCouldEarn.replace('{amount}', formatUsd(estimatedYearlyGain))}
                        </span>
                        <span className="text-text-muted text-[9px]">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                </button>
            }

            {/* Token list */}
            {isExpanded && (
                <div className="mt-1 border border-white/[0.04] rounded-xl overflow-hidden">
                    {idleTokens.map((token, i) => {
                        const estimates = estimateOppurtunities({ apy, totalAssets, tokens: [token], dolaPriceUsd })
                        const tokenYearlyGain = estimates.estimatedNewApy / 100 * token.usd;
                        return (
                            <button
                                key={token.address}
                                onClick={() => onSelectToken?.(token)}
                                className={`w-full flex items-center justify-between text-xs px-3 py-2.5 transition-colors duration-150 ${i > 0 ? 'border-t border-white/[0.03]' : ''} ${onSelectToken ? 'hover:bg-white/[0.03] cursor-pointer' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Image height={20} width={20} src={token.logoUri} alt={token.symbol} className="w-5 h-5 rounded-full" />
                                    <span className="text-text-secondary font-medium">{token.symbol}</span>
                                    <span className="text-foreground font-mono">{formatUsd(token.usd)}</span>
                                </div>
                                <span className="text-success font-mono font-medium">+{formatUsd(tokenYearlyGain)}/yr</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const SelectedOpportunity = ({
    token,
    apy,
    totalAssets,
    priceUsd,
    depositUsd,
    estimatedOutput,
}: {
    token: SupportedToken
    apy: number
    totalAssets: number
    priceUsd: number
    depositUsd: number
    estimatedOutput: string
}) => {
    const { t } = useLanguage();

    if (!depositUsd || depositUsd <= 0) return null;

    const depositDola = priceUsd ? depositUsd / priceUsd : depositUsd;
    const newTotalAssets = totalAssets + depositDola;
    const estimatedNewApy = newTotalAssets ? apy * (totalAssets / newTotalAssets) : 0;
    const estimatedYearlyGain = estimatedNewApy / 100 * depositUsd;

    return (
        <div className="flex justify-between text-sm">
            <div className="flex flex-col gap-0.5">
                <span className="text-text-muted text-xs">{t.estApyAfterDeposit}</span>
                <span className="text-text-muted text-xs">{t.estYearlyGains}</span>
                <span className="text-text-muted text-xs">{t.estimatedOutput}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-accent font-semibold text-xs gradient-text">{formatApy(estimatedNewApy)}</span>
                <span className="font-mono text-success text-xs">+{formatUsd(estimatedYearlyGain)}/yr</span>
                <span className="font-mono text-primary text-xs">{estimatedOutput ? `${formatTokenAmount(estimatedOutput, token.decimals, 2)} ${token.zapSymbol || token.symbol}` : '-'}</span>
            </div>
        </div>
    );
}
