"use client";

import { ArrowRight, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-black selection:bg-green-500 selection:text-white">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob dark:opacity-20 dark:mix-blend-normal dark:bg-green-900"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 dark:opacity-20 dark:mix-blend-normal dark:bg-yellow-900"></div>
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 dark:opacity-20 dark:mix-blend-normal dark:bg-pink-900"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8">
                            Fresh veggies, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
                                tracked to your door.
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-300 mb-10 max-w-lg leading-relaxed">
                            VeggieMap connects you with local fruit and vegetable vendors in real-time.
                            Find moving carts and shops near you instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/auth/signin">
                                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 h-14 px-8 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all hover:scale-105">
                                    Find Vendors <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="/auth/signup?role=vendor">
                                <Button variant="outline" size="lg" className="gap-2 h-14 px-8 rounded-full border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all hover:scale-105">
                                    Join as Vendor <Truck className="w-5 h-5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-10 flex items-center gap-4 text-sm text-zinc-500">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold overflow-hidden`}>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" />
                                    </div>
                                ))}
                            </div>
                            <p>Trusted by 500+ locals</p>
                        </div>
                    </motion.div>

                    {/* Visual Content (3D or Illustration) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative h-[500px] w-full flex items-center justify-center rounded-2xl overflow-hidden"
                    >
                        {/* Abstract Gradient / Placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 backdrop-blur-3xl" />

                        <div className="relative z-10 text-center p-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <MapPin className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Live Tracking Demo</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">Interactive map preview coming soon</p>
                        </div>

                        {/* Floating Card Overlay */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="absolute bottom-6 left-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 z-10 max-w-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Vendor nearby</p>
                                    <p className="text-xs text-zinc-500">Ramu's Fresh Carts is 2 min away</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Hero;
