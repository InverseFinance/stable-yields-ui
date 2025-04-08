"use client"

import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { smartShortNumber } from '@/lib/utils';
import { ChartData } from '@/app/types';

const CHART_COLORS = [
    'gold',
    'blue',
    'teal',
    'skyblue',
    'brown',
    'green',
    'darkblue',
    'darkgreen',
];

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    if (day !== 1 && day !== 15) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

const formatTs = (ts: number) => {
    const date = new Date(ts);
    const day = date.getDate();
    // if (day !== 1 && day !== 15) return '';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

interface ChartDataPoint {
    timestamp: string;
    ts: number;
    apy: number;
    tvlUsd: number;
}

export default function FuturisticChart({ data, allowZoom = true }: { data: ChartData[] }) {
    const { theme } = useTheme();
    const [activeMetric, setActiveMetric] = useState<'apy' | 'tvl'>('apy');
    const isDark = theme === 'dark';

    const itemsWithChartData = useMemo(() => {
        return data.filter(item => item.chartData && item.chartData.length > 0);
    }, [data]);

    const processedData = useMemo(() => {
        if (itemsWithChartData.length === 0) return [];

        const allTimestamps = new Set<string>();
        itemsWithChartData.forEach(item => {
            item.chartData?.forEach((point: ChartDataPoint) => {
                allTimestamps.add(point.timestamp);
            });
        });

        const sortedTimestamps = Array.from(allTimestamps).sort();
        return sortedTimestamps.map(timestamp => {
            const day = timestamp.substring(0, 10);
            const point: any = { timestamp: day, ts: +(new Date(day)) };
            itemsWithChartData.forEach((item) => {
                const dataPoint = item.chartData?.find((d: ChartDataPoint) => d.timestamp.substring(0, 10) === day);
                if (dataPoint) {
                    point[`${item.symbol}_apy`] = dataPoint.apy;
                    point[`${item.symbol}_tvl`] = dataPoint.tvlUsd;
                }
            });
            return point;
        });
    }, [itemsWithChartData]);

    // If no items have chart data, don't render the chart
    if (itemsWithChartData.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
                <p className="text-muted-foreground text-sm mb-2">
                    {new Date(label).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
                {payload.map((entry: any, index: number) => {
                    const [symbol] = entry.dataKey.split('_');
                    const value = activeMetric === 'apy'
                        ? `${entry.value.toFixed(2)}%`
                        : smartShortNumber(entry.value, 1, true, true);

                    return (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-foreground text-sm">
                                {symbol}: {value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <motion.div
            className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    90d Historical {activeMetric.toUpperCase()} Evolution for the current Top 5
                </h3>
                {/* <div className="flex gap-2">
                    <button
                        onClick={() => setActiveMetric('apy')}
                        className={`px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors ${activeMetric === 'apy'
                                ? 'bg-primary text-muted-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        APY
                    </button>
                    <button
                        onClick={() => setActiveMetric('tvl')}
                        className={`px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors ${activeMetric === 'tvl'
                                ? 'bg-primary text-muted-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        TVL
                    </button>
                </div> */}
            </div>

            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                    data={processedData}                    
                    >
                        <defs>
                            {itemsWithChartData.map((item, index) => (
                                <linearGradient
                                    key={item.symbol}
                                    id={`gradient-${item.symbol}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            ))}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="ts"
                            scale="time"
                            type="number"
                            tick={{ fill: isDark ? '#999' : '#666' }}
                            tickLine={{ stroke: isDark ? '#999' : '#666' }}
                            axisLine={{ stroke: isDark ? '#999' : '#666' }}
                            tickFormatter={formatTs}
                            allowDataOverflow={true}
                            domain={['dataMin', 'dataMax']}
                            // interval={30}
                            // angle={-45}
                            textAnchor="end"
                        // height={50}
                        />

                        <YAxis
                            tick={{ fill: isDark ? '#999' : '#666' }}
                            tickLine={{ stroke: isDark ? '#999' : '#666' }}
                            axisLine={{ stroke: isDark ? '#999' : '#666' }}
                            tickFormatter={(value) =>
                                activeMetric === 'apy'
                                    ? `${value}%`
                                    : smartShortNumber(value, 0, true)
                            }
                        />

                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {itemsWithChartData.map((item, index) => (
                            <Area
                                key={item.symbol}
                                type="basis"
                                dataKey={`${item.symbol}_${activeMetric}`}
                                name={item.symbol}
                                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                fill={`url(#gradient-${item.symbol})`}
                                // fill={`#00000000`}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 6,
                                    stroke: CHART_COLORS[index % CHART_COLORS.length],
                                    strokeWidth: 2,
                                    fill: isDark ? '#1a1a1a' : '#ffffff',
                                }}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
                {/* <p className="text-muted-foreground text-xs sm:text-sm mb-4">
                    Chart data from Defillama
                </p> */}
            </div>
        </motion.div>
    );
}
