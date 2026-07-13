"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, MapPin, ShoppingBasket } from "lucide-react";

const steps = [
    {
        title: "Search Nearby",
        description:
            "Enter your location or use GPS to find vegetable vendors in your area.",
        icon: Search,
        color: "bg-blue-500",
        light: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
    },
    {
        title: "Track Live",
        description:
            "See the real-time location of mobile vendors as they move through your neighborhood.",
        icon: MapPin,
        color: "bg-green-500",
        light: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
    },
    {
        title: "Buy Fresh",
        description:
            "Visit the vendor and buy fresh produce directly. No middlemen, just fresh food.",
        icon: ShoppingBasket,
        color: "bg-orange-500",
        light: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
    },
];

const HowItWorks = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"],
    });

    // Animate a tracking line extending downward as you scroll
    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    // Animate a cart "driving" down the line
    const cartY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section
            id="how-it-works"
            className="py-32 bg-white dark:bg-[#050505] relative overflow-hidden"
        >
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm font-semibold mb-6"
                    >
                        How it works
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
                    >
                        From farm to{" "}
                        <span className="text-zinc-400 dark:text-zinc-500">table.</span>
                    </motion.h2>
                </div>

                <div ref={containerRef} className="relative">
                    {/* The Track (Background Line) */}
                    <div className="absolute left-12 md:left-1/2 top-4 bottom-4 w-1 bg-zinc-100 dark:bg-zinc-900 -translate-x-1/2 rounded-full hidden md:block"></div>

                    {/* The Active Track (Foreground Line) */}
                    <div className="absolute left-12 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 rounded-full overflow-hidden hidden md:block">
                        <motion.div
                            style={{ height: lineHeight }}
                            className="w-full bg-gradient-to-b from-blue-500 via-green-500 to-orange-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        ></motion.div>
                    </div>

                    {/* The Floating Tracker */}
                    <div className="absolute left-12 md:left-1/2 top-4 bottom-4 -translate-x-1/2 z-20 pointer-events-none hidden md:block">
                        <motion.div
                            style={{ y: cartY }}
                            className="relative -mt-3 -ml-[14px] w-8 h-8 rounded-full bg-white dark:bg-zinc-950 border-4 border-green-500 shadow-xl flex items-center justify-center transform scale-125"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping motion-reduce:animate-none"></div>
                        </motion.div>
                    </div>

                    {/* Steps mapping */}
                    <div className="space-y-16 md:space-y-32">
                        {steps.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, delay: 0.1 }}
                                    className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                                >
                                    {/* Spacer for alternating layout on desktop */}
                                    <div className="hidden md:block flex-1"></div>

                                    {/* Mobile/Tablet Connector Node */}
                                    <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 shrink-0 md:hidden pb-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                                            <step.icon className={`w-8 h-8 ${step.text}`} />
                                        </div>
                                    </div>

                                    {/* Content Block */}
                                    <div className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-[32px] p-8 md:p-12 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-500 group">
                                        <div
                                            className={`w-16 h-16 ${step.light} rounded-2xl flex items-center justify-center mb-8 ${step.text} group-hover:scale-110 transition-transform duration-500 hidden md:flex`}
                                        >
                                            <step.icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
                                            {step.title}
                                        </h3>
                                        <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;