import { YieldData } from "@/app/types";
import FuturisticTable from "./ui/futuristic-table";

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
    timestamp,
}: {
    data: YieldData[];
    timestamp: number;
}) => {
    return <FuturisticTable
        scrollableBody={false}
        data={data?.map(d => ({ ...d, type: d.isVault ? 'Tokenized Vault' : 'Lending' }))}
        columns={COLUMNS}
        timestamp={timestamp}
    />
}
