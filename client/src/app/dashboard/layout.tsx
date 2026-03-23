"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, LayoutDashboard, UtensilsCrossed, Settings, LogOut, Store, Menu, X, Bell, Bug } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import GoogleTranslate from "@/components/landing/Language";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import ReportBugModal from "@/components/ui/ReportBugModal";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);

    const navigate = (href: string) => {
        if (navigatingTo || pathname === href) return; // already there or already navigating
        setNavigatingTo(href);
        setIsMobileMenuOpen(false);
        router.push(href);
    };

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (user.role !== "vendor") {
                router.push("/map");
            }
        }
    }, [user, isLoading, router]);

    // Close mobile menu on route change, and reset any loading state
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setNavigatingTo(null);
    }, [pathname]);

    if (isLoading || !user || user.role !== "vendor") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    const currentTabName = navItems.find((item) => item.href === pathname)?.name || "Dashboard";

    const SidebarContent = () => (
        <>
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-green-400/20">
                    {(user as any).shopImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={(user as any).shopImage}
                            alt="Shop"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = "none";
                                el.nextElementSibling?.removeAttribute("style");
                            }}
                        />
                    ) : null}
                    <Store className="text-white w-5 h-5" style={(user as any).shopImage ? { display: "none" } : undefined} />
                </div>
                <div className="min-w-0">
                    <h1 className="font-bold text-zinc-900 dark:text-white truncate text-sm">{(user as any).shopName || "Seller Hub"}</h1>
                    <p className="text-xs text-zinc-500 font-medium truncate">VeggieMap Vendor</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-2">Menu</div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isLoading = navigatingTo === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
                            disabled={!!navigatingTo}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 text-left",
                                isActive
                                    ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 shadow-sm ring-1 ring-green-600/10"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200",
                                navigatingTo && !isLoading && "opacity-50"
                            )}
                        >
                            {isLoading
                                ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                                : <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "stroke-[2.5]" : "stroke-2")} />
                            }
                            <span>{isLoading ? "Loading…" : item.name}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {user.name || user.vendorName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">{user.email}</p>
                </div>
                <Button
                    onClick={() => setIsBugModalOpen(true)}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 rounded-xl mb-1"
                >
                    <Bug className="w-5 h-5" />
                    Report a Bug
                </Button>
                <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </div>
        </>
    );

    return (
        <>
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col md:flex-row">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-[260px] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-10 sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                        />
                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 flex flex-col md:hidden shadow-2xl"
                        >
                            <div className="absolute right-4 top-4">
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Responsive Topbar */}
                <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 supports-backdrop-filter:bg-white/60">
                    <div className="flex items-center gap-3">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white hidden sm:block">
                            {currentTabName}
                        </h2>
                    </div>

                    {/* Topbar Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <GoogleTranslate />
                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" className="rounded-full relative">
                            <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8 relative">
                    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
                        {/* Title for mobile since it's hidden in topbar sometimes */}
                        <div className="sm:hidden mb-6">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {currentTabName}
                            </h2>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
        <ReportBugModal open={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
        </>
    );
}
