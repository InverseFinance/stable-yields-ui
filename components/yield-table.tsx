import { ChartData, YieldData } from "@/app/types";
import FuturisticTable from "./ui/futuristic-table";
import FuturisticChart from "./ui/futuristic-chart";

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
        key: 'tvl',
        label: 'TVL',
        type: 'usd',
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
}: {
    data: YieldData[];
    chartData: ChartData[];
    timestamp: number;
}) => {
    return (
        <div className="flex flex-col gap-8 w-full">
            <FuturisticTable
                scrollableBody={false}
                data={data?.map(d => ({ ...d, type: d.isVault ? 'Tokenized Vault' : 'Lending' }))}
                columns={COLUMNS}
                timestamp={timestamp}
            />
            <FuturisticChart data={chartData} />
        </div>
    );
}
