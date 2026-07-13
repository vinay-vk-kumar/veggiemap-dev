"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Store, MapPin, Heart, ArrowRight, ChevronRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await api.get('/consumer/favorites');
                setFavorites(res.data);
            } catch (error) {
                console.error("Failed to load favorites", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full h-full overflow-y-auto pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 lg:mb-12">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center shadow-sm">
                            <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 fill-red-600" />
                        </div>
                        My Favourites
                    </h1>
                    <p className="text-zinc-500 mt-2 ml-[52px] lg:ml-[60px] font-medium">
                        Your saved street vendors and local shops
                    </p>
                </div>
                <div className="text-sm font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full hidden md:block">
                    {favorites.length} {favorites.length === 1 ? 'Saved Vendor' : 'Saved Vendors'}
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Store className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No favorites yet</h3>
                    <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Save vendors you like to find them quickly next time.</p>
                    <Link href="/map">
                        <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12">Explore Nearby</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {favorites.map((vendor) => (
                        <Link
                            href={`/shop/${vendor.userId}`}
                            key={vendor._id}
                            className="group flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-sm hover:shadow-lg hover:border-green-200 dark:hover:border-green-900/50 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex gap-4 lg:gap-5 h-full">
                                <div className="relative w-24 h-24 lg:w-28 lg:h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-shrink-0 overflow-hidden shadow-sm">
                                    {vendor.shopImage ? (
                                        <img src={vendor.shopImage} alt={vendor.vendorName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                            <Store className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm",
                                        vendor.isOnline
                                            ? "bg-green-500/90 text-white"
                                            : "bg-black/60 text-white"
                                    )}>
                                        {vendor.isOnline ? "OPEN" : "CLOSED"}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-zinc-900 dark:text-white truncate text-lg leading-tight group-hover:text-green-600 transition-colors">
                                                {vendor.shopName || vendor.vendorName}
                                            </h3>
                                            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-green-500 transition-colors" />
                                        </div>
                                        <p className="text-sm text-zinc-500 truncate mt-1">
                                            {vendor.vendorType === 'static' ? 'Static Shop' : 'Mobile Cart'} • Veggies & Fruits
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                            View Menu
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
