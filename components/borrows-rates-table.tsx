import Image from "next/image";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FuturisticTable from "./ui/futuristic-table";

const COLUMNS = [
    {
        key: 'project',
        label: 'Project',
    },
    {
        key: 'collateral',
        label: 'Collateral',
    },
    {
        key: 'borrowRate',
        label: 'Borrow Rate',
    },
    {
        key: 'borrowToken',
        label: 'Stablecoin',
    },
    {
        key: 'hasLeverage',
        label: 'Looping',
    },
    {
        key: 'type',
        label: 'Rate Type',
    },
]

export const BorrowRatesTable = ({
    data,
    timestamp,
    projectCollaterals,
}: {
    data: {
        project: string;
        collateral: string;
        borrowRate: number;
        borrowToken: string;
        hasLeverage: boolean;
        type: string;
    }[];
    timestamp: number;
    projectCollaterals: {
        [key: string]: string[];
    };
}) => {
    return <FuturisticTable data={data} columns={COLUMNS} timestamp={timestamp} projectCollaterals={projectCollaterals} />
}
