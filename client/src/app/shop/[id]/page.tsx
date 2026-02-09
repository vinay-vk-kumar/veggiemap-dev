"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, MapPin, Phone, Clock, Store, ShoppingBag, ChevronLeft, Share2, MessageCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import MenuImage from "@/components/ui/MenuImage";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner"; // Assuming sonner is installed

interface Vendor {
    _id: string;
    vendorName: string;
    shopName?: string;
    shopImage?: string;
    phoneNumber?: string;
    isOnline: boolean;
    location?: {
        coordinates: [number, number];
    };
    menu: {
        _id: string;
        productName: string;
        pricePerKg: number;
        itemStatus: "in-stock" | "out-of-stock";
        image?: string;
        category?: "vegetable" | "fruit" | "other";
    }[];
    businessHours?: {
        start: string;
        end: string;
        isOpen: boolean;
    };
}

export default function ShopPage() {
    const params = useParams();
    const router = useRouter();
    const vendorId = params.id as string;

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (vendorId) {
            fetchVendor();
            checkFavorite();
        }
    }, [vendorId]);

    const fetchVendor = async () => {
        try {
            const response = await api.get(`/consumer/vendor/${vendorId}`);
            setVendor(response.data);
        } catch (err: any) {
            console.error("Failed to fetch vendor:", err);
            setError(err.response?.data?.message || "Failed to load shop details.");
        } finally {
            setIsLoading(false);
        }
    };

    const checkFavorite = async () => {
        try {
            const res = await api.get('/consumer/favorites');
            // Check if vendorId exists in favorites (assuming res.data is array of populated objects)
            const isFav = res.data.some((v: any) => v._id === vendorId || v.userId === vendorId);
            setIsFavorite(isFav);
        } catch (err) {
            console.error("Failed to check favorites:", err);
        }
    };

    const toggleFavorite = async () => {
        try {
            const res = await api.post(`/consumer/favorites/${vendorId}`);
            const status = res.data.status;
            if (status === 'added') {
                setIsFavorite(true);
                toast.success("Added to favorites");
            } else {
                setIsFavorite(false);
                toast.success("Removed from favorites");
            }
        } catch (err) {
            console.error("Failed to toggle favorite:", err);
            toast.error("Failed to update favorites");
        }
    };

    const handleWhatsApp = () => {
        if (!vendor?.phoneNumber) return;
        const message = `Hello ${vendor.shopName || vendor.vendorName}, I saw your shop on Seller App and want to order.`;
        const whatsappUrl = `https://wa.me/${vendor.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4 p-4 text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-zinc-400" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Shop Not Found</h1>
                <p className="text-zinc-500 max-w-xs">{error || "This shop link seems to be invalid or the shop has closed."}</p>
                <Button onClick={() => router.push('/map')} variant="outline">
                    Go to Map
                </Button>
            </div>
        );
    }

    // Group menu items by category
    const groupedMenu = vendor.menu.reduce((acc, item) => {
        const cat = item.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, typeof vendor.menu>);

    const categories = ["vegetable", "fruit", "other"].filter(cat => groupedMenu[cat]?.length > 0);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32">
            {/* Header / Cover */}
            <header className="relative w-full h-72 md:h-80">
                {vendor.shopImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={vendor.shopImage} alt={vendor.shopName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-600 to-teal-800 flex items-center justify-center">
                        <Store className="w-24 h-24 text-white/40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Navbar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="secondary"
                            className={cn(
                                "rounded-full backdrop-blur-md border border-white/10 transition-colors",
                                isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-black/20 text-white hover:bg-black/40"
                            )}
                            onClick={toggleFavorite}
                        >
                            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                        </Button>

                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: vendor.shopName || vendor.vendorName,
                                        text: `Check out ${vendor.shopName || vendor.vendorName} on Seller!`,
                                        url: window.location.href
                                    }).catch(() => { });
                                }
                            }}
                        >
                            <Share2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Shop Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white pb-8">
                    <h1 className="text-3xl md:text-5xl font-extrabold truncate leading-tight mb-2 tracking-tight">
                        {vendor.shopName || vendor.vendorName}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium opacity-90">
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm backdrop-blur-sm",
                            vendor.isOnline
                                ? "bg-green-500/30 border-green-400/50 text-green-200"
                                : "bg-red-500/30 border-red-400/50 text-red-200"
                        )}>
                            {vendor.isOnline ? "Open Now" : "Closed"}
                        </span>
                        {vendor.businessHours && (
                            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                                <Clock className="w-3.5 h-3.5 text-zinc-300" />
                                {vendor.businessHours.start} - {vendor.businessHours.end}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                            <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                            {vendor.location ? "Verified Location" : "No Location"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Menu List */}
            <main className="px-4 py-6 max-w-2xl mx-auto space-y-10 -mt-4 relative z-10">
                {categories.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-zinc-200" />
                        <h3 className="text-xl font-bold text-zinc-400">Menu is Empty</h3>
                        <p className="text-sm text-zinc-400 mt-1">Check back later for fresh updates.</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <section key={category}>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white capitalize mb-5 flex items-center gap-2">
                                {category === 'vegetable' ? '🥦 Fresh Vegetables' : category === 'fruit' ? '🍎 Fresh Fruits' : '📦 Others'}
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {groupedMenu[category].map((item) => (
                                    <div key={item._id} className={cn(
                                        "group bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]",
                                        item.itemStatus === 'out-of-stock' && "opacity-60 grayscale"
                                    )}>
                                        <div className="relative w-28 h-28 bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-800">
                                            <MenuImage src={item.image} alt={item.productName} category={item.category} />
                                            {item.itemStatus === 'out-of-stock' && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider border border-white/30 px-2 py-1 rounded-full bg-black/30">
                                                        Sold Out
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-zinc-900 dark:text-white text-lg truncate leading-tight">
                                                    {item.productName}
                                                </h3>
                                            </div>

                                            <div className="mt-auto flex items-end justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">₹{item.pricePerKg}</span>
                                                    <span className="text-sm font-medium text-zinc-400">/ kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* Sticky Floating Action Bar */}
            <div className="fixed bottom-6 left-4 right-4 z-50 flex gap-3 max-w-md mx-auto">
                {/* WhatsApp (Primary) */}
                {vendor.phoneNumber && (
                    <Button
                        className="flex-1 h-14 rounded-full shadow-lg shadow-green-600/20 bg-green-600 hover:bg-green-700 text-white text-lg font-bold gap-2 transition-transform hover:scale-105 active:scale-95"
                        onClick={handleWhatsApp}
                    >
                        <MessageCircle className="w-6 h-6 fill-current" />
                        Chat
                    </Button>
                )}

                {/* Map (Icon) */}
                {vendor.location && (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-14 w-14 rounded-full shadow-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 hover:scale-105 active:scale-95 transition-all"
                        asChild
                    >
                        <Link href={`/map?vendorId=${vendor._id}&lat=${vendor.location.coordinates[1]}&lng=${vendor.location.coordinates[0]}`}>
                            <MapPin className="w-6 h-6 text-blue-600" />
                        </Link>
                    </Button>
                )}

                {/* Call (Icon) */}
                {vendor.phoneNumber && (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-14 w-14 rounded-full shadow-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 hover:scale-105 active:scale-95 transition-all"
                        asChild
                    >
                        <a href={`tel:${vendor.phoneNumber}`}>
                            <Phone className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                        </a>
                    </Button>
                )}
            </div>
        </div>
    );
}
