'use client';
import { ChartData, StakingData } from "@/app/types";
import FuturisticTable from "./ui/futuristic-table";
import FuturisticChart from "./ui/futuristic-chart";
import { TokenPrices } from "@/lib/fetchTokenPrices";
import { LanguageProvider } from "@/lib/useLanguage";

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
    return (
        <LanguageProvider>
            <div className="flex flex-col gap-8 w-full">
                <FuturisticTable
                    tokenPrices={tokenPrices}
                    usTreasuryYield={usTreasuryYield}
                    scrollableBody={false}
                    data={data?.map(d => ({ ...d, tokens: (d.tokens ? d.tokens : [d]), type: d.isVault ? 'Tokenized Vault' : 'Lending' }))}
                    columns={COLUMNS}
                    timestamp={timestamp}
                />
                <FuturisticChart data={chartData} />
            </div>
        </LanguageProvider>
    );
}
