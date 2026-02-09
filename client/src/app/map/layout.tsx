"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Map as MapIcon, Heart, User, Search, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ConsumerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (user.role === "vendor") {
                router.push("/dashboard"); // Redirect vendors to their dashboard
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role === "vendor") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    const navItems = [
        { name: "Explore", href: "/map", icon: MapIcon },
        { name: "Favorites", href: "/map/favorites", icon: Heart },
        { name: "Profile", href: "/map/profile", icon: User },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col md:flex-row font-sans">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-50 h-screen sticky top-0">
                <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="font-extrabold text-2xl text-green-600 tracking-tight">VeggieMap</h1>
                    <p className="text-sm text-zinc-500 font-medium">Fresh & Local</p>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-200 group",
                                pathname === item.href
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-sm"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                        >
                            <item.icon className={cn(
                                "w-6 h-6 transition-transform group-hover:scale-110",
                                pathname === item.href ? "fill-current" : ""
                            )} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-zinc-500 truncate font-medium">Consumer Account</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content (Map/Pages) */}
            <main className="flex-1 relative h-[100dvh] md:h-screen overflow-hidden bg-zinc-50 dark:bg-black">
                {children}
            </main>

            {/* Mobile Bottom Navigation (Glassmorphism) */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-black/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/10 dark:border-zinc-700 text-white rounded-full flex justify-around items-center p-2 shadow-2xl z-50 safe-area-pb transition-all duration-300">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/40 -translate-y-2 scale-110"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            {isActive && (
                                <span className="absolute -bottom-6 text-[10px] font-bold text-black dark:text-white opacity-0 animate-in fade-in slide-in-from-bottom-2">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}
