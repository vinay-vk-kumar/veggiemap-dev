"use client";

import { motion } from "framer-motion";
import {
    Map,
    Navigation,
    ShoppingBag,
    Clock,
    Satellite,
    LineChart,
    MoveRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Features = () => {
    return (
        <section
            id="features"
            className="py-32 bg-[#fafafa] dark:bg-[#050505] overflow-hidden"
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm font-semibold mb-6"
                    >
                        Features
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
                    >
                        Precision mapping for <br />
                        <span className="text-green-500">hyperlocal commerce.</span>
                    </motion.h2>
                </div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* BENTO 1: Large Feature - Real-Time Tracking */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-2 md:row-span-1 min-h-[320px] rounded-[32px] bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent dark:from-green-500/10 pointer-events-none"></div>
                        <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-[80px] group-hover:bg-green-500/20 transition-colors duration-700"></div>

                        <div className="relative z-10 w-full md:w-2/3 h-full flex flex-col justify-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Navigation className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                                Live Cart Tracking
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                                Watch vegetable carts move on the map in real-time. No more
                                guessing when the fresh produce will arrive in your street.
                            </p>
                        </div>

                        {/* Decorative Radar Sweep */}
                        <div className="absolute right-0 top-0 h-full w-[40%] hidden md:flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="w-48 h-48 border border-green-500/20 rounded-full flex items-center justify-center">
                                <div className="w-32 h-32 border border-green-500/30 rounded-full flex items-center justify-center">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full animate-pulse motion-reduce:animate-none border border-green-500/40 relative">
                                        {/* Sweeper */}
                                        <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-green-500 to-transparent origin-left animate-[spin_3s_linear_infinite] motion-reduce:animate-none"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO 2: Tall Feature */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-1 md:row-span-2 min-h-[320px] rounded-[32px] bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 relative overflow-hidden group flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-500/5 dark:to-yellow-500/10 pointer-events-none"></div>

                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                            Transparent Pricing
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8">
                            Check what vendors are selling and their current prices before you
                            even step out of the house.
                        </p>

                        <div className="mt-auto relative h-48 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 overflow-hidden">
                            {/* Inventory List Mock */}
                            <div className="space-y-3">
                                {[
                                    { name: "Organic Tomatoes", price: "₹40/kg", tag: "Fresh" },
                                    { name: "Red Onions", price: "₹35/kg", tag: "Restocked" },
                                    { name: "Farm Apples", price: "₹120/kg", tag: "Premium" },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-yellow-600 dark:text-yellow-500">
                                                {item.tag}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                                            {item.price}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO 3: Small Square */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="md:col-span-1 md:row-span-1 min-h-[320px] rounded-[32px] bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 relative group"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:-rotate-[-10deg] transition-transform duration-500">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                            Always Fresh
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            No warehouses, no cold storage. Buy produce exactly when it hits
                            your neighborhood street.
                        </p>
                    </motion.div>

                    {/* BENTO 4: Small Square */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:col-span-1 md:row-span-1 min-h-[320px] rounded-[32px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg p-8 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 dark:via-black/5 dark:to-black/10"></div>
                        <div className="w-12 h-12 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white dark:text-zinc-900 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Satellite className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Hyperlocal Radius</h3>
                        <p className="text-zinc-300 dark:text-zinc-600">
                            Filter street vendors directly inside your 5km radius to find the
                            absolute closest options instantly.
                        </p>

                        {/* Decorative Icon */}
                        <Map className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 dark:text-black/5 group-hover:scale-110 transition-transform duration-700" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Features;