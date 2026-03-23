"use client";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Store, Eye, MousePointerClick, Share2, Edit, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function DashboardOverview() {
    const { user, updateUser } = useAuth();
    const { socket } = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ totalItems: 0, activeItems: 0, views: 0, todayOrders: 0 });
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const [isOledMode, setIsOledMode] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wakeLockRef = useRef<any>(null);
    const watchIdRef = useRef<number | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/vendor/stats");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setIsStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Initial State Sync
    useEffect(() => {
        if (user) {
            setIsOnline(!!user.isOnline);
        }
    }, [user]);

    // Handle Wake Lock and Geolocation strictly for Mobile Vendors
    useEffect(() => {
        if (!user || user.vendorType !== 'mobile') return;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log('Wake Lock active');
                }
            } catch (err: any) {
                console.error('Wake Lock error:', err.name, err.message);
            }
        };

        const releaseWakeLock = async () => {
            if (wakeLockRef.current !== null) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                console.log('Wake Lock released');
            }
        };

        if (isOnline) {
            requestWakeLock();

            // Start GPS tracking
            if (navigator.geolocation && socket) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        socket.emit('vendor:location-update', {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (err) => console.error("GPS Watch Error:", err),
                    { enableHighAccuracy: true, maximumAge: 0 }
                );
            }

            // Inactivity timer for OLED Mode (30s)
            const resetTimer = () => {
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                if (isOnline && !isOledMode) {
                    inactivityTimerRef.current = setTimeout(() => setIsOledMode(true), 30000);
                }
            };

            window.addEventListener('touchstart', resetTimer);
            window.addEventListener('click', resetTimer);
            resetTimer();

            return () => {
                releaseWakeLock();
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                window.removeEventListener('touchstart', resetTimer);
                window.removeEventListener('click', resetTimer);
            };
        } else {
            setIsOledMode(false);
            releaseWakeLock();
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        }
    }, [isOnline, user, socket, isOledMode]);

    const toggleOnlineStatus = async () => {
        setIsLoading(true);
        const newStatus = !isOnline;

        // Optimistic update
        setIsOnline(newStatus);

        try {
            await api.patch("/vendor/toggle-online", { isOnline: newStatus });
            updateUser({ ...user!, isOnline: newStatus });

            // Socket Event logic in future
        } catch (error: any) {
            console.error("Failed to toggle status:", error);
            toast.error("Failed to go online: " + (error.response?.data?.message || error.message));
            setIsOnline(!newStatus); // Revert state
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = () => {
        if (!user) return;
        const shopUrl = `${window.location.origin}/shop/${user.userId}`;
        const text = `Buy fresh vegetables from ${user.vendorName || "my shop"} on VeggieMap! Check out my menu here: ${shopUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, "_blank");
    };

    return (
        <div className="space-y-8 pb-24 md:pb-0">
            {/* OLED Power Saver Mode Overlay */}
            {isOledMode && user?.vendorType === 'mobile' && (
                <div
                    className="fixed top-0 left-0 w-[100vw] h-[100dvh] z-[99999] bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden touch-none"
                    onClick={() => setIsOledMode(false)}
                >
                    {/* Concentric Radar Rings */}
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                        className="absolute w-24 h-24 rounded-full border border-emerald-500/50 pointer-events-none"
                    />
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
                        className="absolute w-24 h-24 rounded-full border border-emerald-500/50 pointer-events-none"
                    />
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 2 }}
                        className="absolute w-24 h-24 rounded-full border border-emerald-500/50 pointer-events-none"
                    />

                    {/* Core Pulse */}
                    <div className="relative flex flex-col items-center gap-6 z-10">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], boxShadow: ["0px 0px 10px rgba(16,185,129,0.5)", "0px 0px 30px rgba(16,185,129,1)", "0px 0px 10px rgba(16,185,129,0.5)"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="w-6 h-6 rounded-full bg-emerald-500 shadow-emerald-500/80"
                        />
                        <p className="text-xl font-medium text-emerald-500/90 tracking-[0.2em] uppercase font-mono">Transmitting</p>
                    </div>

                    <p className="absolute bottom-12 text-sm text-zinc-200 font-medium tracking-wide">Tap anywhere to return</p>
                </div>
            )}

            {/* Extremely Large & Clear Status Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={cn(
                    "relative overflow-hidden rounded-[32px] p-8 md:p-10 transition-all duration-500 shadow-xl",
                    isOnline
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                )}
            >
                <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center">
                    <div className={cn(
                        "p-5 rounded-2xl transition-all duration-500",
                        isOnline ? "bg-white/20 shadow-inner backdrop-blur-md" : "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                        <Store className={cn("w-12 h-12 md:w-16 md:h-16", isOnline ? "text-white drop-shadow-md" : "text-zinc-400")} />
                    </div>

                    <div>
                        <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
                            {isOnline ? "You are Online" : "You are Offline"}
                        </h3>
                        <p className={cn("text-base md:text-xl font-medium", isOnline ? "text-emerald-100" : "text-zinc-500")}>
                            {isOnline
                                ? "Customers can find you on the map!"
                                : "Turn on to start selling."}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-3">
                        {/* Massive Toggle for Accessibility */}
                        <div className="scale-150 transform origin-center">
                            <Switch
                                checked={isOnline}
                                onCheckedChange={toggleOnlineStatus}
                                disabled={isLoading}
                                className={cn(
                                    "data-[state=checked]:bg-white",
                                    "data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-700 h-6 w-11"
                                )}
                                thumbClassName={cn(
                                    isOnline ? "bg-emerald-600 shadow-emerald-900/50" : "bg-white shadow-sm"
                                )}
                            />
                        </div>
                        <span className={cn("text-xs font-bold tracking-widest uppercase mt-4", isOnline ? "text-emerald-200" : "text-zinc-400")}>
                            {isLoading ? "Updating..." : "Tap to Switch"}
                        </span>
                    </div>
                </div>

                {/* Animated Background Blob when online */}
                {isOnline && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ duration: 1 }}
                        className="absolute -right-20 -bottom-20 w-80 h-80 bg-white rounded-full blur-[80px]"
                    />
                )}
            </motion.div>

            {/* Hoverable Stats Section */}
            <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 px-2 font-outfit tracking-tight">Store Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-3 hover:scale-[1.02] hover:shadow-xl transition-all cursor-default">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 w-fit rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div className="mt-2">
                            {isStatsLoading ? (
                                <Skeleton className="h-10 w-20" />
                            ) : (
                                <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">{stats.views}</p>
                            )}
                            <p className="text-sm text-zinc-500 font-semibold mt-1">Profile Views</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-3 hover:scale-[1.02] hover:shadow-xl transition-all cursor-default">
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/50 w-fit rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                            <MousePointerClick className="w-6 h-6" />
                        </div>
                        <div className="mt-2">
                            {isStatsLoading ? (
                                <Skeleton className="h-10 w-16" />
                            ) : (
                                <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">{stats.totalItems}</p>
                            )}
                            <p className="text-sm text-zinc-500 font-semibold mt-1">Menu Items</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Massive Easy-Tap Action Buttons */}
            <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 px-2 font-outfit tracking-tight">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/dashboard/menu" className="bg-white dark:bg-zinc-950 p-6 rounded-[24px] border-2 border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-5 hover:border-emerald-500 hover:shadow-lg dark:hover:border-emerald-500 transition-all group active:scale-[0.98]">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                            <Store className="w-8 h-8 text-zinc-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-zinc-900 dark:text-white font-outfit">Update Menu</h4>
                            <p className="text-sm font-medium text-zinc-500 mt-1">Change prices or stock</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </Link>

                    <button onClick={handleShare} className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-[24px] shadow-lg flex items-center gap-5 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group">
                        <div className="p-4 bg-white/20 whitespace-pre backdrop-blur-md rounded-2xl border border-white/20">
                            <Share2 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-white tracking-tight font-outfit">Share Shop</h4>
                            <p className="text-sm font-medium text-emerald-100 mt-1">Send your link on WhatsApp</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
