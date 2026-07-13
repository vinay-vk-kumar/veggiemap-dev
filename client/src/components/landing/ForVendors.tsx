"use client";

import Link from "next/link";
import {
    CheckCircle2,
    TrendingUp,
    Users,
    Smartphone,
    Store,
    ShieldCheck,
    ArrowUpRight,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const benefits = [
    {
        title: "Reach More Customers",
        description:
            "Be visible to thousands of nearby customers looking for fresh produce.",
        icon: Users,
    },
    {
        title: "Boost Your Sales",
        description:
            "Vendors on VeggieMap report up to 30% increase in daily earnings.",
        icon: TrendingUp,
    },
    {
        title: "Easy to Use",
        description:
            "Simple mobile app designed for everyone. No tech skills needed.",
        icon: Smartphone,
    },
];

const ForVendors = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const yApp = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const yFloat = useTransform(scrollYProgress, [0, 1], [-20, 40]);
    const rotateFloat = useTransform(scrollYProgress, [0, 1], [-5, 5]);

    return (
        <section
            id="vendors"
            ref={containerRef}
            className="py-24 sm:py-32 bg-[#050505] text-white relative overflow-hidden"
        >
            {/* Immersive Background Elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-green-500/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
                {/* Micro Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center cursor-default">
                    {/* Text Column */}
                    <div className="lg:pr-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-semibold mb-6 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        >
                            For Street Vendors & Shop Owners
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
                        >
                            Grow your business with{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                VeggieMap
                            </span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xl text-zinc-400 mb-10 leading-relaxed font-medium"
                        >
                            Stop waiting for customers to come to you. Broadcast your live
                            location and inventory, and let local buyers find you instantly.
                        </motion.p>

                        <ul className="space-y-6 mb-12">
                            {benefits.map((benefit, i) => (
                                <motion.li
                                    key={benefit.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                    className="flex gap-4 group"
                                >
                                    <div className="shrink-0 mt-1 bg-zinc-800/80 p-2 rounded-xl h-fit border border-zinc-700/50 group-hover:bg-green-500/10 group-hover:border-green-500/30 transition-colors">
                                        <benefit.icon className="w-5 h-5 text-zinc-400 group-hover:text-green-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">
                                            {benefit.title}
                                        </h4>
                                        <p className="text-zinc-400 mt-1 leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Link
                                href="/auth/signup"
                                className="group inline-flex items-center justify-center rounded-full text-base font-bold bg-green-500 text-black hover:bg-green-400 h-14 px-8 transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                            >
                                Register as Vendor
                                <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Premium Animated Showcase Column */}
                    <div className="relative h-[650px] w-full flex items-center justify-center mt-12 lg:mt-0 lg:-ml-12 perspective-1000 hidden md:flex">
                        <motion.div
                            style={{ y: yApp }}
                            className="relative w-full max-w-[420px] h-[580px] bg-[#111] rounded-[40px] shadow-2xl border border-zinc-800/80 overflow-hidden"
                        >
                            {/* Inner Glass Highlights */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-transparent opacity-50"></div>
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-green-500/20 blur-[60px] rounded-full"></div>

                            {/* App Header Mock */}
                            <div className="absolute top-0 w-full p-6 border-b border-zinc-800/50 bg-[#111]/80 backdrop-blur-xl z-20">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">
                                            R
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">
                                                Ramesh Cart
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 w-max px-2 py-0.5 rounded-full mt-0.5">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                </span>
                                                Online & Transmitting
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* App Content Mock */}
                            <div className="p-6 pt-28 h-full flex flex-col gap-4 relative z-10">
                                {/* Sales Graph Mock */}
                                <div className="bg-zinc-900/80 rounded-3xl p-5 border border-zinc-800/50">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">
                                                Today's Sales
                                            </p>
                                            <h4 className="text-3xl font-bold text-white">₹ 4,250</h4>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
                                            +32% <TrendingUp className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* Bar Chart Mock */}
                                    <div className="flex items-end justify-between h-20 gap-2 mt-6">
                                        {[40, 60, 30, 80, 50, 90, 100].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-full bg-zinc-800 rounded-t-sm group-hover:bg-zinc-700 transition-colors relative group/bar"
                                            >
                                                <div
                                                    className={`absolute bottom-0 w-full rounded-t-sm ${i === 6 ? "bg-green-500" : "bg-zinc-700"}`}
                                                    style={{ height: `${h}%` }}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Orders Mock */}
                                <div className="mt-2 text-white">
                                    <h5 className="font-semibold text-sm mb-3">Live Inventory</h5>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Tomatoes", status: "In Stock", price: "40/kg" },
                                            { name: "Onions", status: "In Stock", price: "35/kg" },
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between items-center p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/50 backdrop-blur-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-lg">
                                                        {i === 0 ? "🍅" : "🧅"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{item.name}</p>
                                                        <p className="text-xs text-zinc-400 mt-0.5">
                                                            {item.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-sm bg-zinc-800 px-3 py-1 rounded-full">
                                                    {item.price}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Interaction Elements */}
                        <motion.div
                            style={{ y: yFloat, rotate: rotateFloat }}
                            className="absolute top-20 -right-8 lg:-right-12 z-30 pointer-events-none"
                        >
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-white/50 dark:border-zinc-700/50 flex items-center gap-4 w-60">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                        Verified Vendor
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        Build instant trust
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            style={{ y: useTransform(scrollYProgress, [0, 1], [40, -20]) }}
                            className="absolute bottom-32 -left-8 lg:-left-16 z-30 pointer-events-none"
                        >
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-white/50 dark:border-zinc-700/50 flex items-center gap-4 w-64">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                        Update Inventory
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        Takes only 2 seconds
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForVendors;