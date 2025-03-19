// @ts-nocheck
"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const projectImages = {
  'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
  'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
  'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
  'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
  'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
  'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Spark': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
  'Fluid': 'https://icons.llamao.fi/icons/protocols/fluid?w=48&h=48',
  'Sky': 'https://coin-images.coingecko.com/coins/images/39925/large/sky.jpg?1724827980',
} as const;

interface TableData {
  symbol?: string;
  project?: string;
  apy?: number;
  avg30d?: number;
  avg60d?: number;
  avg90d?: number;
  image?: string;
  borrowRate?: number;
  type?: string;
  hasLeverage?: boolean;
  borrowToken?: string;
  collateral?: string;
}

interface Column {
  key: string;
  label: string;
}

export default function FuturisticTable({
  timestamp,
  data,
  columns,
  projectCollaterals
}: {
  timestamp: number;
  data: TableData[];
  columns: Column[];
  projectCollaterals?: {
    [key: string]: string[];
  };
}) {
  const [sortConfig, setSortConfig] = useState<any>({ key: "apy", direction: "desc" });
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key] ?? 0;
    const bValue = b[sortConfig.key] ?? 0;
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="w-full mt-10">
      <motion.div
        className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-gray-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative max-h-[50vh] overflow-hidden">
          <table className="w-full text-left text-white table-fixed">
            <colgroup>
              {columns.map((column) => (
                <col
                  key={column.key}
                  className={
                    column.className + ' w-min-[150px]'
                  }
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 bg-gray-900/50 backdrop-blur-lg z-10">
              <tr className="text-gray-300">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="p-3 text-xl cursor-pointer hover:text-blue-400 transition"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label} {sortConfig.key === column.key && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="overflow-y-auto max-h-[50vh]">
            <table className="w-full text-left text-white table-fixed">
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column.key}
                    className={
                      column.className + ' w-min-[150px]'
                    }
                  />
                ))}
              </colgroup>
              <tbody>
                {sortedData.map((item, index) => (
                  <motion.tr
                    key={index}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {columns.map((column) => (
                      <td className={`p-3 font-extrabold text-xl ${item[column.key] === true || item[column.key] === 'fixed' ? 'text-green-400' : ''}`} key={column.key}>
                        {
                          column.key === 'project' ?
                            <a className="underline hover:text-blue-400 transition" href={item.link} target="_blank" rel="noopener noreferrer">
                              <div className="flex items-center gap-2">
                                <Image className="rounded-full" src={projectImages[item["project"]] || `https://icons.llamao.fi/icons/protocols/${item["project"].toLowerCase().replace(/ /g, '-')}?w=48&h=48`} alt={item['project']} width={30} height={30} />
                                <span className="text-xl">{item["project"]}</span>
                              </div>
                            </a> :
                            ['symbol', 'borrowToken'].includes(column.key) ?
                              <a className="underline hover:text-blue-400 transition" href={item.link} target="_blank" rel="noopener noreferrer">
                                <div className="flex items-center gap-2">
                                  <Image className="rounded-full" src={item["image"]} alt={item['symbol']} width={30} height={30} />
                                  <span className="text-xl">{item[column.key]}</span>
                                </div>
                              </a> :
                              typeof item[column.key] === 'number' ? `${(item[column.key] as number).toFixed(2)}%`
                                : typeof item[column.key] === 'string' ? item[column.key].replace('fixed', 'Fixed').replace('variable', 'Variable')
                                  : typeof item[column.key] === 'boolean' ? item[column.key] ? 'Yes' : 'No'
                                    : item[column.key]
                        }
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {
          timestamp && <p className="text-gray-400 text-sm mt-2">
            Last updated: {new Date(timestamp).toLocaleString('en-US', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
             })}</p>
        }
      </motion.div>
    </div>
  );
}
