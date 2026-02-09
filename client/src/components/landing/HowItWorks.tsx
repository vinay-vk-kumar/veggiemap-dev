"use client";

import { motion } from "framer-motion";
import { Search, MapPin, ShoppingBasket } from "lucide-react";

const steps = [
    {
        title: "Search Nearby",
        description: "Enter your location or use GPS to find vegetable vendors in your area.",
        icon: Search,
    },
    {
        title: "Track Live",
        description: "See the real-time location of mobile vendors as they move through your neighborhood.",
        icon: MapPin,
    },
    {
        title: "Buy Fresh",
        description: "Visit the vendor and buy fresh produce directly. No middlemen, just fresh food.",
        icon: ShoppingBasket,
    },
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-white dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                        How it works
                    </h2>
                    <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                        Finding fresh vegetables has never been easier.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-green-200 dark:via-green-900/30 to-transparent border-t-2 border-dashed border-green-300 dark:border-green-800/50 -z-0" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col items-center text-center z-10"
                        >
                            <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full border-4 border-green-50 dark:border-green-900/10 flex items-center justify-center mb-6 shadow-sm">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-600/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <step.icon className="w-8 h-8" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                                {step.title}
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
