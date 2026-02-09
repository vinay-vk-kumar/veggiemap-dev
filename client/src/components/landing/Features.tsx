"use client";

import { motion } from "framer-motion";
import { Map, Navigation, ShoppingBag, Clock } from "lucide-react";

const features = [
    {
        name: "Real-Time Tracking",
        description: "See exactly where mobile vegetable carts are moving on a live map.",
        icon: Navigation,
    },
    {
        name: "Geospatial Search",
        description: "Find vendors based on your current location and inventory needs.",
        icon: Map,
    },
    {
        name: "Live Inventory",
        description: "Check what's in stock before you step out to buy.",
        icon: ShoppingBag,
    },
    {
        name: "Instant Updates",
        description: "Vendors update their location and stock status instantly.",
        icon: Clock,
    },
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                        Everything you need to find fresh food.
                    </h2>
                    <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        VeggieMap bridges the gap between traditional street vendors and modern convenience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                                {feature.name}
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
