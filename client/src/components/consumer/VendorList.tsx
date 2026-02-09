"use client";

import { useMapStore } from "@/store/useMapStore";
import { VendorMarker } from "@/hooks/useVendors";
import { Loader2, Store, Search } from "lucide-react";
import Image from "next/image";
import { useVendors } from "@/hooks/useVendors";
import { Input } from "@/components/ui/input";
import { FilterModal } from "@/components/map/FilterModal";

export default function VendorList() {
    const {
        data: vendors = [],
        isLoading,
        isFetching,
        searchQuery,
        setSearchQuery
    } = useVendors();

    const { setSelectedVendorId, selectedVendorId, setCenter, filters, setFilters } = useMapStore();

    const handleVendorClick = (vendor: VendorMarker) => {
        setSelectedVendorId(vendor._id);
        setCenter([vendor.lat, vendor.lng]); // Highlight on map
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
            {/* Header: Search & Filter */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search vendors, items..."
                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-600" />}
                </div>
                <div className="flex gap-2">
                    <FilterModal currentFilters={filters} onApply={setFilters} />
                </div>
                <div className="text-xs text-zinc-500 font-medium">
                    {vendors.length} vendors nearby
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading && !vendors.length ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400" /></div>
                ) : (
                    vendors.map((vendor) => (
                        <div
                            key={vendor._id}
                            onClick={() => handleVendorClick(vendor)}
                            className={`
                                group flex gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                                ${selectedVendorId === vendor._id
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-white border-transparent hover:border-zinc-200 dark:bg-zinc-900 dark:hover:border-zinc-700 shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            {/* Image */}
                            <div className="w-24 h-24 shrink-0 relative rounded-lg overflow-hidden bg-zinc-100">
                                {vendor.shopImage ? (
                                    <Image
                                        src={vendor.shopImage}
                                        alt={vendor.vendorName}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <Store className="w-8 h-8" />
                                    </div>
                                )}
                                {!vendor.isOnline && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded">Closed</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                        {vendor.shopName || vendor.vendorName}
                                    </h3>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {vendor.vendorType} • {((vendor.distance || 0) / 1000).toFixed(1)} km
                                    </p>
                                </div>

                                {vendor.menu && vendor.menu.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                                        {vendor.menu.slice(0, 3).map((item, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                                {item.productName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
