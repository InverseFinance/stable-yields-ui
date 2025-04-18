// @ts-nocheck
"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { gaEvent, smartShortNumber } from "@/lib/utils";

const projectImages = {
  'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
  'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
  'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
  'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
  'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
  'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
  'Inverse': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
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
  projectCollaterals,
  scrollableBody = true
}: {
  timestamp: number;
  data: TableData[];
  columns: Column[];
  projectCollaterals?: {
    [key: string]: string[];
  };
  scrollableBody?: boolean;
}) {
  const [sortConfig, setSortConfig] = useState<any>({ key: "apy", direction: "desc" });
  const [showModal, setShowModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<TableData | null>(null);

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

  const handleCta = (item: TableData) => {
    gaEvent({ action: `supply-${item.project}-${item.symbol}`, params: { stable: item.symbol, project: item.project, key: `${item.symbol}_${item.project}`, apy: item.apy } });
    setPendingItem(item);
    setShowModal(true);
  };

  const handleDismiss = () => {
    setShowModal(false);
    setPendingItem(null);
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        handleDismiss();
      }
    };

    if (showModal) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  return (
    <div className="w-full">
      <motion.div
        className="bg-container backdrop-blur-lg rounded-2xl p-2 sm:p-4 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="overflow-x-auto">
            <div className={`${scrollableBody ? 'max-h-[60vh]' : ''} overflow-y-auto`}>
              <table className="w-full text-left text-foreground min-w-[800px]">
                <thead className="sticky top-0 backdrop-blur-lg z-10">
                  <tr className="text-muted-foreground">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="min-w-[125px] p-2 sm:p-3 text-sm sm:text-base lg:text-xl cursor-pointer hover:text-primary transition whitespace-nowrap"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label} {sortConfig.key === column.key && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, index) => (
                    <motion.tr
                      key={index}
                      className="table-border hover:bg-muted/50 transition"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {columns.map((column) => (
                        <td 
                          className={`min-w-[125px] p-2 sm:p-3 text-primary-foreground text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap ${
                            item[column.key] === true || item[column.key] === 'fixed' ? 'text-green-400' : ''
                          }`} 
                          key={column.key}
                        >
                          {
                            column.isCta ? (
                              <button className="cta-button text-sm sm:text-base" onClick={() => handleCta(item)}>
                                {column.ctaText}
                              </button>
                            ) : column.key === 'project' ? (
                              <div className="flex items-center gap-2">
                                <Image 
                                  className="rounded-full w-5 h-5 sm:w-7 sm:h-7" 
                                  src={projectImages[item["project"]] || `https://icons.llamao.fi/icons/protocols/${item["project"].toLowerCase().replace(/ /g, '-')}?w=48&h=48`} 
                                  alt={item['project']} 
                                  width={24} 
                                  height={24} 
                                />
                                <span className="text-sm sm:text-base lg:text-lg">{item["projectLabel"]}</span>
                              </div>
                            ) : ['symbol', 'borrowToken'].includes(column.key) ? (
                              <div className="flex items-center gap-2">
                                <Image 
                                  className="rounded-full w-5 h-5 sm:w-7 sm:h-7" 
                                  src={item["image"]} 
                                  alt={item['symbol']} 
                                  width={24} 
                                  height={24} 
                                />
                                <span className="text-sm sm:text-base lg:text-lg">{item[column.key]}</span>
                              </div>
                            ) : typeof item[column.key] === 'number' ? 
                                column.type === 'usd' ? `${smartShortNumber(item[column.key], 1, true, true)}` : `${item[column.key] ? (item[column.key]).toFixed(2)+'%' : '-'}` :
                              typeof item[column.key] === 'string' ? 
                                (item[column.key].replace('fixed', 'Fixed').replace('variable', 'Variable') || '-') :
                              typeof item[column.key] === 'boolean' ? 
                                item[column.key] ? 'Yes' : 'No' :
                                item[column.key] || '-'
                          }
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {timestamp && (
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">
            Last updated: {new Date(timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </p>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-container p-4 sm:p-6 rounded-xl shadow-xl max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">External Link Disclaimer</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                You are about to visit an external website. We are not affiliated with or responsible for the content on external sites and only provide a link for your convenience.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={handleDismiss}
                  className="cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <a href={pendingItem?.link} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={() => gaEvent({ action: `continue-${pendingItem?.project}-${pendingItem?.symbol}`, params: { stable: pendingItem?.symbol, project: pendingItem?.project, key: `${pendingItem?.symbol}_${pendingItem?.project}`, apy: pendingItem?.apy } })}
                    className="cta-button cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground"
                  >
                    Continue
                  </button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
