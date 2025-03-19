"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export const AppNav = ({ activeItem }: { activeItem: string }) => {
    const navItems = [
        { name: "Stable Yields", path: "/stable-yields" },
        // { name: "Borrow Rates", path: "/borrow-rates" },
    ];

    return (
        <div className="w-full mt-10">
            <motion.nav
                className="bg-gray-900/50 backdrop-blur-lg p-3 rounded-2xl shadow-lg border border-gray-800 flex justify-center gap-6 max-w-md mx-auto mt-5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {navItems.map((item) => {
                    const isActive = activeItem === item.path;
                    return (
                        <Link key={item.name} href={item.path}>
                            <motion.div
                                className={`relative px-4 py-2 rounded-lg transition-all cursor-pointer ${isActive ? "text-blue-200 font-semibold" : "text-gray-300 hover:text-white"
                                    }`}
                                whileHover={{ scale: 1.1 }}
                            >
                                {item.name}
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-x-0 -bottom-1 h-1 bg-blue-400 rounded-full"
                                        layoutId="underline"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </motion.nav>
        </div>
    );
}
