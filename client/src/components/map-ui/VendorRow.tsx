"use client";

import * as React from "react";
import Image from "next/image";
import { Store, Navigation, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorMarker } from "@/hooks/useVendors";
import { motion } from "framer-motion";

type Props = {
  vendor: VendorMarker;
  active?: boolean;
  onClick: () => void;
};

export function VendorRow({ vendor, active, onClick }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex gap-4 p-3.5 rounded-3xl border transition-all duration-300 relative overflow-hidden group",
        active
          ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 ring-1 ring-green-600/10 shadow-sm"
          : "bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/80 hover:border-green-200 hover:shadow-md dark:hover:border-green-900"
      )}
    >
      <div className="w-[84px] h-[84px] shrink-0 relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-sm">
        {vendor.shopImage ? (
          <Image
            src={vendor.shopImage}
            alt={vendor.shopName || vendor.vendorName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 group-hover:text-green-600 transition-colors">
            <Store className="w-8 h-8" />
          </div>
        )}

        {!vendor.isOnline ? (
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white px-2.5 py-1 rounded-full shadow-lg">
              Closed
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-bold text-base text-zinc-900 dark:text-white truncate">
                {vendor.shopName || vendor.vendorName}
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full">
                <Navigation className="w-3 h-3 text-green-600" />
                {((vendor.distance || 0) / 1000).toFixed(1)} km
            </div>
        </div>
        
        <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            <span className="capitalize">{vendor.vendorType}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            {vendor.isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                    Open
                </span>
            ) : "Offline"}
        </div>

        {vendor.menu && vendor.menu.length > 0 ? (
          <div className="flex gap-1.5 mt-2.5 overflow-hidden relative">
            {vendor.menu.slice(0, 3).map((item: any, i: number) => (
              <span
                key={i}
                className="text-[11px] font-semibold px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-200/50 dark:border-zinc-800 whitespace-nowrap"
              >
                {item.productName}
              </span>
            ))}
            {vendor.menu.length > 3 && (
                <span className="text-[11px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-200/50 dark:border-green-500/20 whitespace-nowrap shrink-0">
                    +{vendor.menu.length - 3}
                </span>
            )}
            {/* Fade out edge */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 pointer-events-none" />
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}
