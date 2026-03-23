"use client";

import { useState } from "react";
import { ArrowRight, MapPin, Truck, ShieldCheck, Heart, Navigation, Store, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const Hero = () => {
    const sectionRef = useRef(null);
    const router = useRouter();
    const [loadingHref, setLoadingHref] = useState<string | null>(null);

    const handleNav = (href: string) => {
        if (loadingHref) return;
        setLoadingHref(href);
        router.push(href);
    };

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });

    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityHeroText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section ref={sectionRef} className="relative min-h-screen pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#fafafa] dark:bg-[#09090b] selection:bg-green-500 selection:text-white flex items-center">
            {/* Immersive Background Gradients */}
            <motion.div style={{ y: yBackground }} className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-green-400/20 dark:bg-green-600/20 rounded-full mix-blend-multiply filter blur-[120px] dark:mix-blend-lighten animate-pulse duration-[8000ms]"></div>
                <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-emerald-300/20 dark:bg-emerald-700/20 rounded-full mix-blend-multiply filter blur-[120px] dark:mix-blend-lighten animate-pulse duration-[10000ms] animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[40%] w-[800px] h-[800px] bg-yellow-300/10 dark:bg-yellow-800/10 rounded-full mix-blend-multiply filter blur-[150px] dark:mix-blend-lighten animate-pulse duration-[12000ms] animation-delay-4000"></div>
                
                {/* Dot Pattern Overlay for Premium Texture */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-50 mask-image:linear-gradient(to_bottom,white,transparent)"></div>
            </motion.div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">

                    {/* Text Content */}
                    <motion.div
                        style={{ opacity: opacityHeroText }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Now in the City
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.05] mb-8">
                            Hyperlocal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400 drop-shadow-sm">
                                Marketplace
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl leading-relaxed font-medium">
                            Connect with nearby street vendors and static shops. Track fresh produce in real-time, right to your hands.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Button
                                onClick={() => handleNav("/auth/signin")}
                                disabled={!!loadingHref}
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 text-white gap-2 h-16 px-10 rounded-2xl shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-105 text-lg font-semibold w-full sm:w-auto min-w-[190px]"
                            >
                                {loadingHref === "/auth/signin"
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Loading…</>
                                    : <>Explore Map <Navigation className="w-5 h-5 ml-1" /></>
                                }
                            </Button>
                            <Button
                                onClick={() => handleNav("/auth/signup")}
                                disabled={!!loadingHref}
                                variant="outline"
                                size="lg"
                                className="gap-2 h-16 px-10 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all hover:scale-105 text-lg font-semibold w-full sm:w-auto text-zinc-800 dark:text-zinc-200 min-w-[190px]"
                            >
                                {loadingHref === "/auth/signup"
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Loading…</>
                                    : <>Sell with us <Store className="w-5 h-5 ml-1" /></>
                                }
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-[3px] border-white dark:border-[#09090b] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shadow-sm`}>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=vendor${i}`} alt="avatar" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-zinc-900 dark:text-white font-bold text-base">
                                    <span className="text-yellow-500">★★★★★</span> 4.9/5
                                </div>
                                <span>Trusted by 5,000+ users</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Premium Visual Content - 3D Mockup Styling */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-[600px] w-full lg:w-[120%] lg:-mr-[20%] rounded-3xl overflow-visible hidden md:block"
                    >
                        {/* Main Floating Map Interface mock */}
                        <motion.div 
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-10 right-10 w-[420px] h-[520px] bg-white dark:bg-zinc-950 rounded-[40px] shadow-2xl border-8 border-zinc-100 dark:border-zinc-900 overflow-hidden transform rotate-[-2deg] z-20"
                        >
                            <div className="w-full h-full bg-[#f3f4f6] dark:bg-[#18181b] relative overflow-hidden">
                                {/* Map Background simulation */}
                                <div className="absolute inset-0 opacity-[0.15] dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                                
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center px-4 gap-3 z-30">
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><MapPin className="w-3 h-3 text-zinc-500" /></div>
                                    <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                </div>

                                {/* Floating Markers */}
                                <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-white dark:bg-black rounded-full shadow-xl flex items-center justify-center z-30 transform -rotate-12 border border-zinc-100 dark:border-zinc-800">
                                    <span className="text-2xl">🥦</span>
                                </div>
                                <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-white dark:bg-black rounded-full shadow-xl flex items-center justify-center z-30 transform rotate-12 border border-zinc-100 dark:border-zinc-800">
                                    <span className="text-2xl">🍎</span>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                     <div className="w-16 h-16 bg-green-500/20 rounded-full animate-ping absolute -inset-1"></div>
                                     <div className="w-14 h-14 bg-green-500 border-4 border-white dark:border-zinc-950 rounded-full shadow-lg z-30 flex items-center justify-center relative">
                                        <Store className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Bottom Sheet mock */}
                                <div className="absolute bottom-0 left-0 w-full h-[45%] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 p-6 flex flex-col gap-4">
                                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto -mt-2 mb-2"></div>
                                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-20 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
                                        <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                    </div>
                                    <div className="h-20 w-full bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-2"></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Micro-Cards */}
                        <motion.div
                            animate={{ y: [10, -10, 10] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute top-32 right-[80px] sm:right-[150px] lg:-left-12 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 z-30 flex items-center gap-4 w-64 transform rotate-2"
                        >
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-sm">Raju's Cart is moving</p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Just 200m away</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-20 left-10 sm:left-20 lg:-right-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 z-30 flexItems-center gap-4 w-56 transform -rotate-3"
                        >
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-sm">Added to favorites</p>
                                <p className="text-xs text-zinc-500 mt-0.5 whitespace-nowrap">Farm Fresh Organics</p>
                            </div>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Hero;
