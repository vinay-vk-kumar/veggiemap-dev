"use client";

import * as React from "react";
import { Loader2, Search, Store, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VendorMarker } from "@/hooks/useVendors";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  value: string;
  onChange: (next: string) => void;
  isLoading?: boolean;
  results: VendorMarker[];
  onPickResult: (vendor: VendorMarker) => void;
};

export function SearchBar({
  value,
  onChange,
  isLoading,
  results,
  onPickResult,
}: Props) {
  const showResults = value.trim().length > 0;
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="pointer-events-auto relative w-full group">
      {/* Premium Integrated Search Pill */}
      <div className={cn(
          "relative flex items-center w-full bg-white/90 dark:bg-zinc-950/90 supports-backdrop-filter:bg-white/70 supports-backdrop-filter:dark:bg-zinc-950/70 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300",
          showResults ? "rounded-t-3xl rounded-b-md" : "rounded-full"
      )}>
        
        <div className="pl-5 pr-2 flex items-center text-zinc-400">
           <Search className="h-5 w-5 transition-colors group-focus-within:text-green-600 dark:group-focus-within:text-green-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search tomato, banana, or vendor..."
          className="flex-1 w-full py-4 pl-3 pr-4 bg-transparent outline-none text-[15px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="pr-2 pl-2 flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 ml-2 h-8">
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              onClick={() => {
                  onChange("");
                  inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Filter options"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          )}

          {/* Optional Loading Indicator replacement directly near action */}
          {isLoading && (
            <div className="absolute right-4 w-5 h-5 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Animated Results Dropdown */}
      <AnimatePresence>
          {showResults && (
            <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-[calc(100%+4px)] left-0 w-full overflow-hidden bg-white/95 dark:bg-zinc-950/95 supports-backdrop-filter:bg-white/80 supports-backdrop-filter:dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_20px_40px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.6)] rounded-b-3xl rounded-t-md max-h-[60vh] overflow-y-auto z-50 divide-y divide-zinc-100 dark:divide-zinc-800/50"
            >
              {results.length === 0 && !isLoading ? (
                <div className="p-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Search className="w-5 h-5 text-zinc-400" />
                  </div>
                  No nearby vendors found. <br/>Try a different vegetable.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                    {results.map((vendor) => (
                    <motion.button
                        key={vendor._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        type="button"
                        className="w-full text-left p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-4 group"
                        onClick={() => onPickResult(vendor)}
                    >
                        {vendor.shopImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={vendor.shopImage}
                            alt={vendor.shopName || vendor.vendorName}
                            className="w-14 h-14 rounded-full object-cover shadow-sm bg-zinc-100 dark:bg-zinc-900 shrink-0 border-2 border-transparent group-hover:border-green-100 dark:group-hover:border-green-900 transition-colors"
                        />
                        ) : (
                        <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0 border-2 border-transparent group-hover:border-green-100 dark:group-hover:border-green-900 transition-colors">
                            <Store className="w-6 h-6" />
                        </div>
                        )}

                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="font-bold text-[15px] text-zinc-900 dark:text-white truncate">
                                {vendor.shopName || vendor.vendorName}
                                </span>
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md shrink-0">
                                {((vendor.distance || 0) / 1000).toFixed(1)} km
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 truncate font-medium">
                                <span className="capitalize">{vendor.vendorType} Shop</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                                {vendor.isOnline ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Open
                                </span>
                                ) : (
                                <span>Closed</span>
                                )}
                            </div>
                        </div>
                    </motion.button>
                    ))}
                </div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
