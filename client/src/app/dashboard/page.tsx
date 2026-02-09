"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Signal, Wifi, WifiOff, Store, Eye, MousePointerClick, Share2, Edit, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardOverview() {
    const { user, updateUser } = useAuth();
    const { socket } = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ totalItems: 0, activeItems: 0, views: 0, todayOrders: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/vendor/stats");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
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

    const toggleOnlineStatus = async () => {
        setIsLoading(true);
        const newStatus = !isOnline;

        // Optimistic update
        setIsOnline(newStatus);

        try {
            await api.patch("/vendor/toggle-online", { isOnline: newStatus });
            updateUser({ ...user!, isOnline: newStatus });

            // Socket Event
            if (newStatus && user?.vendorType === 'mobile') {
                // Mobile vendors start emitting location
            } else if (!newStatus) {
                // Offline
            }

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
        const shopUrl = `${window.location.origin}/shop/${user.userId}`; // Future public shop page
        const text = `Buy fresh vegetables from ${user.vendorName || "my shop"} on VeggieMap! Check out my menu here: ${shopUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, "_blank");
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* 1. Header & Status Section */}
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        Hello, {user?.vendorName?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        {user?.vendorType === 'static'
                            ? (user.shopName || "Your Shop")
                            : "Mobile Vendor"}
                    </p>
                </div>

                {/* Large Status Card */}
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 shadow-sm border",
                        isOnline
                            ? "bg-green-600 border-green-500 text-white"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                    )}
                >
                    <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
                        <div className={cn(
                            "p-4 rounded-full transition-all",
                            isOnline ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"
                        )}>
                            <Store className={cn("w-8 h-8", isOnline ? "text-white" : "text-zinc-400")} />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold">
                                {isOnline ? "You are Online" : "You are Offline"}
                            </h3>
                            <p className={cn("text-sm mt-1", isOnline ? "text-green-100" : "text-zinc-500")}>
                                {isOnline
                                    ? "Customers can see you on the map."
                                    : "Go online to start receiving orders."}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mt-2 bg-white/10 dark:bg-black/10 rounded-full px-1 py-1 pr-6 backdrop-blur-sm">
                            <Switch
                                checked={isOnline}
                                onCheckedChange={toggleOnlineStatus}
                                disabled={isLoading}
                                className={cn(
                                    "data-[state=checked]:bg-white data-[state=checked]:text-green-600",
                                    "data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-700"
                                )}
                                thumbClassName={cn(
                                    isOnline ? "bg-green-600" : "bg-white"
                                )}
                            />
                            <span className={cn("text-sm font-medium", isOnline ? "text-white" : "text-zinc-500 dark:text-zinc-400")}>
                                {isOnline ? "Online" : "Offline"}
                            </span>
                        </div>
                    </div>

                    {/* Background Pattern */}
                    {isOnline && (
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    )}
                </div>
            </div>

            {/* 2. Stats Section (Horizontal Scroll on Mobile) */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white px-1">Overview</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
                    <div className="min-w-[160px] md:min-w-0 md:flex-1 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3 snap-start">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 w-fit rounded-xl text-blue-600">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">--</p>
                            <p className="text-xs text-zinc-500 font-medium">Profile Views</p>
                        </div>
                    </div>

                    <div className="min-w-[160px] md:min-w-0 md:flex-1 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3 snap-start">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 w-fit rounded-xl text-purple-600">
                            <MousePointerClick className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalItems}</p>
                            <p className="text-xs text-zinc-500 font-medium">Menu Items</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard/menu" className="col-span-1 bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4 hover:border-green-500/50 transition-colors group">
                    <div className="p-2.5 bg-white dark:bg-zinc-800 w-fit rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform">
                        <Edit className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">Update Menu</h4>
                        <p className="text-[11px] text-zinc-500 leading-tight mt-1">Add items or change prices</p>
                    </div>
                </Link>

                <div onClick={handleShare} className="col-span-1 bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg cursor-pointer active:scale-95 transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-white/20 w-fit rounded-xl backdrop-blur-sm">
                            <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                    <div className="mt-4">
                        <h4 className="font-bold">Share Shop</h4>
                        <p className="text-[11px] text-green-50 leading-tight mt-1">Get more customers</p>
                    </div>
                </div>

                <Link href={`/shop/${user?.userId}`} target="_blank" className="col-span-2 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <Store className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">Preview Public Shop Page</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-green-600 transition-colors" />
                </Link>
            </div>
        </div>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
