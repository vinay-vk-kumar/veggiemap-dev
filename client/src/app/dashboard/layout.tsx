"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Loader2, LayoutDashboard, UtensilsCrossed, Settings, LogOut, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("overview");

    const { socket, isAuthenticated } = useSocket();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (user.role !== "vendor") {
                router.push("/map");
            }
        }
    }, [user, isLoading, router]);


    if (isLoading || !user || user.role !== "vendor") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard, id: "overview" },
        { name: "My Menu", href: "/dashboard/menu", icon: UtensilsCrossed, id: "menu" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings, id: "settings" },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(user as any).shopImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={(user as any).shopImage} alt="Shop" className="w-full h-full object-cover" />
                        ) : (
                            <Store className="text-white w-6 h-6" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-zinc-900 dark:text-white truncate text-sm">{(user as any).shopName || "Seller Hub"}</h1>
                        <p className="text-xs text-zinc-500 truncate">VeggieMap Vendor</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-300"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {user.name || user.vendorName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <Button
                        onClick={logout}
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative pb-24 md:pb-0">
                <div className="p-4 md:p-8 max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around p-2 z-50 safe-area-bottom pb-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl transition-all w-20 tap-highlight-transparent",
                                isActive
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-full mb-1 transition-all",
                                isActive ? "bg-green-100 dark:bg-green-900/20 transform scale-110" : ""
                            )}>
                                <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            </div>
                            <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-green-700 dark:text-green-400" : "")}>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}
