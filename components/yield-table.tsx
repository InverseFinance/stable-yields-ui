'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChartData, LeverageData, LpData, StakingData } from "@/app/types";
import FuturisticTable from "./ui/futuristic-table";
import FuturisticChart from "./ui/futuristic-chart";
import { TokenPrices } from "@/lib/fetchTokenPrices";
import { LanguageProvider } from "@/lib/useLanguage";
import { gaEvent } from "@/lib/analytics";
import { UserPositions } from "./UserPositions";
import { LpsTable } from "./LpsTable";
import { LeverageTable } from "./LeverageTable";
import { hasRoomToBorrow } from "@/lib/leverage";

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

const TABS = [
    { key: 'stables', label: 'Stables', path: '/' },
    { key: 'stable-pairs', label: 'Stable Pairs', path: '/pairs' },
    { key: 'leverage', label: 'Leverage', path: '/leverage' },
] as const;

export type TabKey = typeof TABS[number]['key'];

const pathOfTab = (tab: TabKey) => TABS.find(t => t.key === tab)!.path;

// the pages a tab owns, the other ones showing the same tables keep their own url
const isTabPath = (pathname: string) => TABS.some(tab => tab.path === (pathname.replace(/(.)\/$/, '$1') || '/'));

// stable default, the positions reload when the LPs change
const NO_LPS: LpData[] = [];
const NO_LEVERAGE: LeverageData[] = [];

const TabEmptyState = ({ text }: { text: string }) => (
    <div className="bg-container rounded-2xl p-10 sm:p-16 text-center text-muted-foreground text-sm sm:text-base">
        {text}
    </div>
);

export const YieldTable = ({
    data,
    chartData,
    lps = NO_LPS,
    leverage = NO_LEVERAGE,
    timestamp,
    usTreasuryYield,
    tokenPrices,
    initialTab = 'stables',
}: {
    data: StakingData[];
    chartData: ChartData[];
    lps?: LpData[];
    leverage?: LeverageData[];
    timestamp: number;
    usTreasuryYield: number;
    tokenPrices: TokenPrices
    // tab the page it is rendered on points to
    initialTab?: TabKey;
}) => {
    const [positionsRefreshKey, setPositionsRefreshKey] = useState(0);
    // only the markets with room left to borrow are an opportunity, the positions still cover the full ones
    const openableLeverage = useMemo(() => leverage.filter(hasRoomToBorrow), [leverage]);
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    const handleTabChange = (tab: TabKey) => {
        gaEvent({ action: 'yields_tab_switch', params: { category: 'yields', label: tab, value: 0 } });
        setActiveTab(tab);
        // the url follows the tab so it can be shared, replaced rather than navigated to keep the loaded data
        if (isTabPath(window.location.pathname)) {
            window.history.replaceState(null, '', `${pathOfTab(tab)}${window.location.search}${window.location.hash}`);
        }
    };

    return (
        <LanguageProvider>
            <div className="flex flex-col gap-8 w-full px-3 sm:px-0">
                <UserPositions data={data} lps={lps} leverage={leverage} tokenPrices={tokenPrices} refreshKey={positionsRefreshKey} />
                <div className="flex flex-col gap-4">
                    <div role="tablist" aria-label="Yield categories" className="flex gap-1 border-b border-border">
                        {TABS.map(tab => {
                            const isActive = tab.key === activeTab;
                            return (
                                <button
                                    key={tab.key}
                                    id={`yields-tab-${tab.key}`}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`yields-panel-${tab.key}`}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`relative cursor-pointer px-4 py-2.5 text-base sm:text-lg font-semibold transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {tab.label}
                                    {isActive && (
                                        <motion.span layoutId="yields-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* panels stay mounted to keep their state when switching tabs */}
                    <div id="yields-panel-stables" role="tabpanel" aria-labelledby="yields-tab-stables" hidden={activeTab !== 'stables'}>
                        <div className="flex flex-col gap-8">
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
                    </div>
                    <div id="yields-panel-stable-pairs" role="tabpanel" aria-labelledby="yields-tab-stable-pairs" hidden={activeTab !== 'stable-pairs'}>
                        {lps.length > 0
                            ? <LpsTable lps={lps} tokenPrices={tokenPrices} onDepositSuccess={() => setPositionsRefreshKey(k => k + 1)} />
                            : <TabEmptyState text="No stable pairs available right now" />}
                    </div>
                    <div id="yields-panel-leverage" role="tabpanel" aria-labelledby="yields-tab-leverage" hidden={activeTab !== 'leverage'}>
                        {openableLeverage.length > 0
                            ? <LeverageTable markets={openableLeverage} />
                            : <TabEmptyState text="No leverage opportunities available right now" />}
                    </div>
                </div>
            </div>
        </LanguageProvider>
    );
}
