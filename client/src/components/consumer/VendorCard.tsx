"use client";

import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, Navigation, Star, Store, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import api from "@/lib/api";

interface Vendor {
    _id: string;
    userId: string;
    vendorName: string;
    shopName?: string;
    shopImage?: string;
    vendorType: "static" | "mobile";
    location?: { coordinates: [number, number] };
    phoneNumber?: string;
    isOnline: boolean;
    distance?: number;
    menu: any[]; // Simplified for card
    lastSeen?: number;
}

interface VendorCardProps {
    vendor: Vendor;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

export default function VendorCard({ vendor, onClose, isFavorite, onToggleFavorite }: VendorCardProps) {
    const [topItems, setTopItems] = useState<any[]>([]);

    useEffect(() => {
        // Filter in-stock items and take top 3
        if (vendor.menu) {
            const available = vendor.menu.filter((item: any) => item.itemStatus === 'in-stock');
            setTopItems(available.slice(0, 3));
        }
    }, [vendor]);

    const [timeAgo, setTimeAgo] = useState("");

    useEffect(() => {
        if (!vendor.lastSeen || vendor.vendorType !== 'mobile') return;
        const updateTime = () => {
            const diffMs = Date.now() - vendor.lastSeen!;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) setTimeAgo("Active now");
            else setTimeAgo(`Seen ${diffMins} min${diffMins !== 1 ? 's' : ''} ago`);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000); // update every minute
        return () => clearInterval(interval);
    }, [vendor.lastSeen, vendor.vendorType]);

    const handleCall = () => {
        if (vendor.phoneNumber) window.open(`tel:${vendor.phoneNumber}`);
    };

    const handleWhatsapp = () => {
        if (!vendor?.phoneNumber) return;
        const message = `Hello ${vendor.shopName || vendor.vendorName}, I saw your shop on Seller App and want to order.`;
        const whatsappUrl = `https://wa.me/${vendor.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleDirections = () => {
        if (vendor.location) {
            const [lng, lat] = vendor.location.coordinates;
            // Use Google Maps URL
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    return (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-4 md:w-[400px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[24px] rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 z-[1000] overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 fade-in duration-500 will-change-transform">
            {/* Header Image */}
            <div className="h-40 bg-zinc-100 relative">
                {vendor.shopImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={vendor.shopImage} alt={vendor.shopName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                        <Store className="w-12 h-12 opacity-50 text-zinc-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <X className="w-4 h-4" />
                </Button>

                <div className="absolute bottom-4 left-5 right-5 text-white">
                    <h3 className="font-extrabold text-2xl truncate shadow-sm font-outfit tracking-tight">
                        {vendor.shopName || vendor.vendorName}
                    </h3>
                    <p className="text-xs flex items-center gap-2 mt-0.5 font-medium truncate pb-1">
                        <span className="text-white/90">{vendor.vendorType === 'mobile' ? 'Mobile Cart' : 'Static Shop'}</span>
                        <span className="text-white/50">•</span>
                        <span className={cn(
                            "flex items-center gap-1",
                            vendor.isOnline ? "text-green-400" : "text-zinc-300"
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", vendor.isOnline ? "bg-green-400" : "bg-zinc-300")} />
                            {vendor.isOnline ? "Open Now" : "Closed"}
                        </span>
                        {vendor.vendorType === 'mobile' && vendor.lastSeen && (
                            <>
                                <span className="text-white/50">•</span>
                                <span className="text-amber-300/90 text-[10px] bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
                                    {timeAgo}
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Distance & Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full text-xs font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        {(vendor.distance ? vendor.distance / 1000 : 0).toFixed(1)} km away
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onToggleFavorite}
                        className={cn("rounded-full h-9 w-9 transition-all hover:scale-105", isFavorite ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-zinc-400 hover:bg-zinc-100")}
                    >
                        <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                    </Button>
                </div>

                {/* Quick Menu Preview */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Today's Fresh Picks</p>
                        {vendor.menu.length > 3 && <span className="text-[10px] text-green-600 font-medium">+{vendor.menu.length - 3} more</span>}
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                        {topItems.length > 0 ? topItems.map((item, idx) => (
                            <div key={idx} className="flex-shrink-0 bg-white dark:bg-zinc-800 shadow-sm p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 w-28 text-center hover:shadow-md transition-shadow">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <div className="h-10 mb-2 flex items-center justify-center">
                                    {item.image ? (
                                        <img src={item.image} className="h-full object-contain" alt={item.productName} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 text-xs font-bold">
                                            {item.productName[0]}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                                <p className="text-xs text-green-600 font-bold mt-0.5">₹{item.pricePerKg}/kg</p>
                            </div>
                        )) : (
                            <div className="w-full text-center py-4 bg-zinc-50 rounded-lg text-zinc-400 text-xs border border-dashed border-zinc-200">
                                Menu availability not listed.
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Actions Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <Button variant="outline" className="flex flex-col h-auto py-3 px-0 gap-1.5 text-[10px] sm:text-xs font-semibold border-zinc-200/60 dark:border-zinc-800 shadow-sm active:scale-95 transition-all bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-[16px]" onClick={handleCall}>
                        <Phone className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        Call
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-3 px-0 gap-1.5 text-[10px] sm:text-xs font-semibold border-zinc-200/60 dark:border-zinc-800 shadow-sm active:scale-95 transition-all bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-[16px]" onClick={handleWhatsapp}>
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Chat
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-3 px-0 gap-1.5 text-[10px] sm:text-xs font-semibold border-zinc-200/60 dark:border-zinc-800 shadow-sm active:scale-95 transition-all bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-[16px]" onClick={handleDirections}>
                        <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                        Map
                    </Button>
                    <Link href={`/shop/${vendor.userId}`} className="contents">
                        <Button variant="default" className="flex flex-col h-auto py-3 px-0 gap-1.5 text-[10px] sm:text-xs font-bold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/30 shadow-lg active:scale-95 transition-all rounded-[16px]">
                            <Store className="w-5 h-5 filter drop-shadow-sm" />
                            Visit
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
