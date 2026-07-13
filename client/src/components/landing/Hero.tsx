"use client";

import { useState, useRef, useEffect } from "react";
import {
    ArrowRight,
    MapPin,
    Truck,
    Heart,
    Navigation,
    Store,
    Loader2,
    Navigation2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useReducedMotion,
} from "framer-motion";
import { Button } from "@/components/ui/button";

const Hero = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const router = useRouter();
    const [loadingHref, setLoadingHref] = useState<string | null>(null);

    const handleNav = (href: string) => {
        if (loadingHref) return;
        setLoadingHref(href);
        router.push(href);
    };

    // Parallax Scroll Effects
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });

    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityHeroText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scaleHeroMockup = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

    // 3D Tilt Effect on Mouse Move
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (typeof window !== "undefined") {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
            const y = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
            mouseX.set(x);
            mouseY.set(y);
        }
    };

    const shouldReduceMotion = useReducedMotion();

    const rotateX = useSpring(useTransform(mouseY, [-1, 1], shouldReduceMotion ? [0, 0] : [10, -10]), {
        damping: 30,
        stiffness: 200,
    });
    const rotateY = useSpring(useTransform(mouseX, [-1, 1], shouldReduceMotion ? [0, 0] : [-10, 10]), {
        damping: 30,
        stiffness: 200,
    });

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white dark:bg-[#050505] selection:bg-green-500 selection:text-white flex items-center perspective-1000"
        >
            {/* Advanced Grid & Radar Background */}
            <motion.div
                style={{ y: yBackground }}
                className="absolute inset-0 w-full h-full -z-10 pointer-events-none flex items-center justify-center"
            >
                {/* Modern Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_40%,#000_70%,transparent_100%)]"></div>

                {/* Radar Sweep Effect */}
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(74,222,128,0.1)_360deg)] rounded-full animate-[spin_4s_linear_infinite] motion-reduce:animate-none mix-blend-plus-lighter hidden lg:block"></div>
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-green-500/10 rounded-full hidden lg:block"></div>
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-green-500/10 rounded-full hidden lg:block"></div>
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-green-500/20 rounded-full hidden lg:block"></div>

                {/* Glowing Orbs */}
                <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-green-400/20 dark:bg-green-500/10 rounded-full filter blur-[100px] animate-pulse motion-reduce:animate-none duration-[8000ms]"></div>
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-emerald-400/20 dark:bg-emerald-700/10 rounded-full filter blur-[120px] animate-pulse motion-reduce:animate-none duration-[10000ms]"></div>
            </motion.div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center lg:pr-10">
                    {/* Text Content */}
                    <motion.div
                        style={{ opacity: opacityHeroText }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm font-semibold mb-8 shadow-sm">
                            <span className="relative flex h-2.5 w-2.5 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                            </span>
                            Live Street Vendor Tracking
                        </div>

                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.05] mb-8">
                            Hyperlocal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400">
                                Fresh Food
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl leading-relaxed font-medium">
                            The ultimate radar for fresh produce. Find, track, and buy from
                            street vendors moving through your neighborhood in real-time.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Button
                                onClick={() => handleNav("/auth/signin")}
                                disabled={!!loadingHref}
                                size="lg"
                                className="group bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black gap-2 h-14 px-8 rounded-full shadow-xl transition-all hover:scale-105 text-base font-semibold w-full sm:w-auto"
                            >
                                {loadingHref === "/auth/signin" ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Launching…
                                    </>
                                ) : (
                                    <>
                                        Find Vectors Nearby{" "}
                                        <Navigation className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleNav("/auth/signup")}
                                disabled={!!loadingHref}
                                variant="outline"
                                size="lg"
                                className="group h-14 px-8 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all hover:scale-105 text-base font-semibold w-full sm:w-auto text-zinc-800 dark:text-zinc-200"
                            >
                                {loadingHref === "/auth/signup" ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                                    </>
                                ) : (
                                    <>
                                        Register as Vendor{" "}
                                        <Store className="w-4 h-4 ml-1 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Premium 3D Visual Content */}
                    <motion.div
                        style={{
                            scale: scaleHeroMockup,
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-[650px] w-full hidden lg:flex items-center justify-center -mr-16"
                    >
                        {/* 3D App UI Mockup */}
                        <div
                            className="relative w-[380px] h-[700px] bg-white dark:bg-zinc-950 rounded-[48px] shadow-2xl border-[12px] border-zinc-100 dark:border-zinc-900 overflow-hidden"
                            style={{ transform: "translateZ(50px)" }}
                        >
                            <div className="w-full h-full relative overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a]">
                                {/* UI Map Layer */}
                                <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply dark:mix-blend-lighten bg-[url('https://maps.wikimedia.org/osm-intl/12/2892/1715.png')] bg-cover bg-center"></div>
                                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px]"></div>

                                {/* Dynamic UI Search Bar */}
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[85%] h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/50 dark:border-zinc-800/50 flex items-center px-4 gap-3 z-30 transform translate-z-[90px]">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                </div>

                                {/* Floating Vendor Marker 1 */}
                                <div className="absolute top-[40%] left-[20%] z-30 transform -rotate-6 translate-z-[120px]">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center p-1 relative z-10 hover:-translate-y-2 transition-transform cursor-pointer">
                                            <span className="text-3xl filter drop-shadow-sm">🥦</span>
                                            <div className="absolute -bottom-2 w-full flex justify-center">
                                                <div className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                                    40/kg
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 transform rotate-45 border-r border-b border-zinc-100 dark:border-zinc-700"></div>
                                    </div>
                                </div>

                                {/* Floating Vendor Marker 2 */}
                                <div className="absolute top-[60%] right-[20%] z-30 transform rotate-6 translate-z-[150px]">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center p-1 relative z-10 hover:-translate-y-2 transition-transform cursor-pointer">
                                            <span className="text-3xl filter drop-shadow-sm">🍎</span>
                                            <div className="absolute -bottom-2 w-full flex justify-center">
                                                <div className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                                    Fresh
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 transform rotate-45 border-r border-b border-zinc-100 dark:border-zinc-700"></div>
                                    </div>
                                </div>

                                {/* User Navigation Cursor */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 translate-z-[180px]">
                                    <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping absolute -inset-[48px]"></div>
                                    <div className="w-10 h-10 bg-blue-500 border-[3px] border-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center relative transform -rotate-45">
                                        <Navigation2 className="w-5 h-5 text-white fill-white" />
                                    </div>
                                </div>

                                {/* UI Bottom Drawer mock */}
                                <div className="absolute bottom-0 left-0 w-full h-[35%] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-t-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-40 p-6 flex flex-col gap-4 border-t border-zinc-200/50 dark:border-zinc-800/50 transform translate-z-[200px]">
                                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto -mt-2 mb-2"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                                        <div className="h-4 w-12 bg-green-100 dark:bg-green-900/50 rounded-full"></div>
                                    </div>
                                    <div className="h-[72px] w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-2 flex items-center px-4 gap-4 hover:border-green-200 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-xl">
                                            🥕
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                                            <div className="h-2 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Floating Micro-Cards (Outside Phone for extreme 3D) */}
                        <motion.div
                            animate={shouldReduceMotion ? { y: 0 } : { y: [15, -15, 15] }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                            className="absolute top-40 -left-12 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 z-50 flex items-center gap-4 w-64 transform -rotate-6 translate-z-[250px]"
                        >
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                    Raju's Cart is moving
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-0.5">
                                    Just 200m away
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={shouldReduceMotion ? { y: 0 } : { y: [-15, 15, -15] }}
                            transition={{
                                duration: 7,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5,
                            }}
                            className="absolute bottom-40 -right-16 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 z-50 flex items-center gap-4 w-56 transform rotate-6 translate-z-[300px]"
                        >
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                    Followed Vendor
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                    Sunita Fruit Corner
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Simplified Visual Content for Mobile */}
                    <motion.div
                        style={{ opacity: opacityHeroText }}
                        className="lg:hidden w-full relative flex items-center justify-center mt-8"
                    >
                        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[32px] shadow-2xl border-[8px] border-zinc-100 dark:border-zinc-900 overflow-hidden relative aspect-[3/4]">
                            {/* Static Map Background */}
                             <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply dark:mix-blend-lighten bg-[url('https://maps.wikimedia.org/osm-intl/12/2892/1715.png')] bg-cover bg-center"></div>
                             <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px]"></div>
                             
                             {/* Mobile UI elements */}
                             <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full gap-8">
                                 {/* Floating marker */}
                                 <div className="relative hover:-translate-y-2 transition-transform cursor-pointer">
                                     <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center p-2 relative z-10">
                                         <span className="text-5xl filter drop-shadow-md">🥦</span>
                                     </div>
                                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-zinc-800 transform rotate-45 border-r border-b border-zinc-100 dark:border-zinc-700"></div>
                                 </div>
                                 
                                 {/* Floating Card */}
                                 <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 flex items-center gap-4 w-[280px]">
                                     <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                                         <Truck className="w-5 h-5" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                             Raju's Cart
                                         </p>
                                         <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-0.5">
                                             Just 200m away
                                         </p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;