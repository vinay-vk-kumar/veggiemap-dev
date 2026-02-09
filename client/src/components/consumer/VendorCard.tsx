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

    const handleCall = () => {
        if (vendor.phoneNumber) window.open(`tel:${vendor.phoneNumber}`);
    };

    const handleWhatsapp = () => {
        if (vendor.phoneNumber) {
            const message = `Hi ${vendor.shopName || vendor.vendorName}, I saw your shop on VeggieMap.`;
            // Clean phone number: remove non-numeric chars
            const cleanNumber = vendor.phoneNumber.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            alert("Vendor has not provided a WhatsApp number.");
        }
    };

    const handleDirections = () => {
        if (vendor.location) {
            const [lng, lat] = vendor.location.coordinates;
            // Use Google Maps URL
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    return (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-4 md:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-[1000] overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 fade-in duration-300">
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

                <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-bold text-xl truncate shadow-sm">
                        {vendor.shopName || vendor.vendorName}
                    </h3>
                    <p className="text-xs text-white/90 flex items-center gap-2 mt-0.5 font-medium">
                        {vendor.vendorType === 'mobile' ? 'Mobile Cart' : 'Static Shop'}
                        <span>•</span>
                        <span className={cn(
                            "flex items-center gap-1",
                            vendor.isOnline ? "text-green-400" : "text-zinc-300"
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", vendor.isOnline ? "bg-green-400" : "bg-zinc-300")} />
                            {vendor.isOnline ? "Open Now" : "Closed"}
                        </span>
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
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="outline" className="flex flex-col h-auto py-2.5 px-0 gap-1.5 text-[10px] border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900" onClick={handleCall}>
                        <Phone className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        Call
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-2.5 px-0 gap-1.5 text-[10px] border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900" onClick={handleWhatsapp}>
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        Chat
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-2.5 px-0 gap-1.5 text-[10px] border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900" onClick={handleDirections}>
                        <Navigation className="w-4 h-4 text-blue-600" />
                        Map
                    </Button>
                    <Link href={`/shop/${vendor.userId}`} className="contents">
                        <Button variant="default" className="flex flex-col h-auto py-2.5 px-0 gap-1.5 text-[10px] bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none shadow-lg">
                            <Store className="w-4 h-4" />
                            Visit Shop
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
