'use client';
import { useState } from 'react';
import { ChartData, StakingData } from "@/app/types";
import FuturisticTable from "./ui/futuristic-table";
import FuturisticChart from "./ui/futuristic-chart";
import { TokenPrices } from "@/lib/fetchTokenPrices";
import { LanguageProvider } from "@/lib/useLanguage";
import { UserPositions } from "./UserPositions";

const COLUMNS = [
    {
        key: 'symbol',
        label: 'Stablecoin',
    },
    {
        key: 'project',
        label: 'Project',
    },
    {
        key: 'apy',
        label: 'APY',
    },
    {
        key: 'avg30',
        label: '30d Avg.',
    },
    // {
    //     key: 'avg60',
    //     label: '60d Avg.',
    // },
    {
        key: 'avg90',
        label: '90d Avg.',
    },
    {
        key: 'tvl',
        label: 'TVL',
        type: 'usd',
    },
    // {
    //     key: 'tvlGrowth90',
    //     label: '90d TVL Growth',
    // },
    {
        key: 'link',
        label: '',
        isCta: true,
        ctaText: 'Supply',
    }
    // {
    //     key: 'type',
    //     label: 'Type',
    //     className: 'w-[200px]'
    // },
]

export const YieldTable = ({
    data,
    chartData,
    timestamp,
    usTreasuryYield,
    tokenPrices,
}: {
    data: StakingData[];
    chartData: ChartData[];
    timestamp: number;
    usTreasuryYield: number;
    tokenPrices: TokenPrices
}) => {
    const [positionsRefreshKey, setPositionsRefreshKey] = useState(0);

    return (
        <LanguageProvider>
            <div className="flex flex-col gap-8 w-full px-3 sm:px-0">
                <UserPositions data={data} tokenPrices={tokenPrices} refreshKey={positionsRefreshKey} />
                <FuturisticTable
                    tokenPrices={tokenPrices}
                    usTreasuryYield={usTreasuryYield}
                    scrollableBody={false}
                    data={data?.map(d => ({ ...d, tokens: (d.tokens ? d.tokens : [d]), type: d.isVault ? 'Tokenized Vault' : 'Lending' }))}
                    columns={COLUMNS}
                    timestamp={timestamp}
                    onDepositSuccess={() => setPositionsRefreshKey(k => k + 1)}
                />
                <FuturisticChart data={chartData} />
            </div>
        </LanguageProvider>
    );
}
