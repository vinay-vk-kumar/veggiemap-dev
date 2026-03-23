"use client";

import * as React from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { Heart, MapPin, MessageCircle, Navigation, Phone, Store, X, Clock, Share2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Vendor = {
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
  menu: any[];
};

type Props = {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function VendorDetailSheet({
  vendor,
  open,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const topItems = React.useMemo(() => {
    const menu = vendor.menu || [];
    return menu.filter((i: any) => i.itemStatus === "in-stock");
  }, [vendor.menu]);

  const soldOutItems = React.useMemo(() => {
    const menu = vendor.menu || [];
    return menu.filter((i: any) => i.itemStatus !== "in-stock");
  }, [vendor.menu]);


  const handleDirections = () => {
    if (!vendor.location) return;
    const [lng, lat] = vendor.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const renderContent = () => (
    <>
      {/* Cover Image Section - Sticky Top styling */}
      <div className="relative h-48 md:h-56 bg-zinc-100 dark:bg-zinc-900 w-full shrink-0">
        {vendor.shopImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.shopImage}
            alt={vendor.shopName || vendor.vendorName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <Store className="w-16 h-16 opacity-50" />
          </div>
        )}

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Right Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "rounded-full h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-md border-0 text-white transition-all shadow-xl",
              isFavorite && "text-red-400 hover:text-red-500"
            )}
            onClick={onToggleFavorite}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-md border-0 text-white shadow-xl md:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Vendor Basic Info overlay */}
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1 truncate drop-shadow-md">
            {vendor.shopName || vendor.vendorName}
          </h2>
          <div className="flex items-center gap-3 text-sm font-medium text-white/90">
            <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
              <span className={cn("w-2 h-2 rounded-full", vendor.isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-zinc-400")} />
              {vendor.isOnline ? "Open" : "Closed"}
            </span>
            <span className="capitalize">{vendor.vendorType}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto w-full pb-8">
        <div className="p-5 space-y-8">

          {/* Info Bar & Quick Actions */}
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl">
                <MapPin className="w-4 h-4 text-green-600" />
                {((vendor.distance || 0) / 1000).toFixed(1)} km away
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl">
                <Info className="w-4 h-4" /> About
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Button
                asChild
                variant="outline"
                className="flex flex-col h-16 py-0 px-0 gap-1.5 text-[11px] rounded-2xl border-zinc-200 dark:border-zinc-800 hover:border-green-600 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors shadow-sm"
                disabled={!vendor.phoneNumber}
              >
                <a href={vendor.phoneNumber ? `tel:${vendor.phoneNumber}` : "#"}>
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex flex-col h-16 py-0 px-0 gap-1.5 text-[11px] rounded-2xl border-zinc-200 dark:border-zinc-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors shadow-sm"
                disabled={!vendor.phoneNumber}
              >
                <a href={vendor.phoneNumber ? `https://wa.me/${vendor.phoneNumber}?text=${encodeURIComponent(`Hello ${vendor.shopName || vendor.vendorName}, I saw your shop on VeggieMap and want to order.`)}` : "#"} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                  Chat
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-16 py-0 px-0 gap-1.5 text-[11px] rounded-2xl border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shadow-sm"
                onClick={handleDirections}
                disabled={!vendor.location}
              >
                <Navigation className="w-5 h-5 text-blue-500" />
                Map
              </Button>
              <Button asChild className="flex flex-col h-16 py-0 px-0 gap-1.5 text-[11px] rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm transition-transform active:scale-95">
                <Link href={`/shop/${vendor.userId}`}>
                  <Store className="w-5 h-5" />
                  Shop
                </Link>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-200/60 dark:bg-zinc-800 w-full" />

          {/* Menu Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pointer-events-none">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Fresh Menu</h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">{topItems.length} items</span>
            </div>

            {topItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:border-green-200 transition-colors gap-4">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800/50">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 flex items-center justify-center text-lg font-bold">
                          {String(item.productName || "?")[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="font-bold text-base text-zinc-900 dark:text-white leading-tight mb-1">{item.productName}</div>
                      <div className="font-extrabold text-green-600 dark:text-green-400 text-lg tracking-tight">₹{item.pricePerKg} <span className="text-sm text-zinc-500 font-medium tracking-normal">/kg</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-10 px-4 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <p className="text-sm font-medium text-zinc-500">Menu items haven't been added yet.</p>
              </div>
            )}
          </div>

          {/* Sold out section */}
          {soldOutItems.length > 0 && (
            <div className="space-y-4 opacity-70">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Sold Out</h3>
              <div className="grid grid-cols-2 gap-3">
                {soldOutItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 filter grayscale">
                    <div className="font-bold text-[14px] text-zinc-700 dark:text-zinc-400 truncate">{item.productName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: Vaul Bottom sheet */}
      <div className="md:hidden">
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[900] backdrop-blur-sm" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[950] rounded-t-[32px] bg-white dark:bg-black max-h-[90vh] flex flex-col overflow-hidden outline-none">

              {/* Floating Vaul Handle for the Cover Image */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-white/40 shadow-sm z-50 backdrop-blur-xl" />

              {renderContent()}

            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* Desktop: Right-side Floating Panel */}
      <div className="hidden md:block">
        {open ? (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="absolute top-[88px] right-6 w-[420px] bottom-6 z-[500] rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Close Button specific for Desktop overlay */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-50 rounded-full h-10 w-10 bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {renderContent()}
          </motion.div>
        ) : null}
      </div>
    </>
  );
}
