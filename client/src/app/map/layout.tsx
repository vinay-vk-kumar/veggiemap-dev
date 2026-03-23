"use client";

import { useEffect, useState, useRef } from "react";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Map as MapIcon, Heart, User, Settings, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleTranslate from "@/components/landing/Language";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import ReportBugModal from "@/components/ui/ReportBugModal";

const MobilePreferencesMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleOpen = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 12,
                right: window.innerWidth - rect.right,
            });
        }
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <>
            <Button
                ref={buttonRef}
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className="rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
                <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </Button>

            {isOpen && typeof window !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    className="fixed w-[260px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in"
                    style={{
                        top: dropdownPos.top,
                        right: dropdownPos.right,
                        zIndex: 999999,
                    }}
                >
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preferences</span>
                    <div className="flex flex-col gap-4">
                        <GoogleTranslate />
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dark Mode</span>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default function ConsumerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    const navigate = (href: string) => {
        if (navigatingTo) return;
        setNavigatingTo(href);
        router.push(href);
    };
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (user.role === "vendor") {
                router.push("/dashboard");
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
            {/* Desktop Sidebar */}
            <aside
                className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0"
                style={{ zIndex: 100 }}
            >
                <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="font-extrabold text-2xl text-green-600 tracking-tight">VeggieMap</h1>
                    <p className="text-sm text-zinc-500 font-medium">Fresh & Local</p>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isNav = navigatingTo === item.href;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                disabled={!!navigatingTo}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-200 group text-left",
                                    isActive
                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200",
                                    navigatingTo && !isNav && "opacity-50"
                                )}
                            >
                                {isNav ? (
                                    <Loader2 className="w-6 h-6 animate-spin flex-shrink-0" />
                                ) : (
                                    <item.icon
                                        className={cn(
                                            "w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110",
                                            isActive ? "fill-current" : ""
                                        )}
                                    />
                                )}
                                {isNav ? "Loading…" : item.name}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
                    <div className="flex flex-col gap-4 px-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preferences</span>
                        <div className="flex flex-col gap-3">
                            <GoogleTranslate />
                            <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Dark Mode</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

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

            {/* Main Content */}
            <main className="flex-1 relative h-[100dvh] md:h-screen flex flex-col overflow-hidden bg-zinc-50 dark:bg-black">
                {/* Mobile Topbar */}
                <header
                    className="md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 absolute top-0 left-0 right-0 shadow-sm pointer-events-auto"
                    style={{ zIndex: 100 }}
                >
                    <h1 className="font-extrabold text-2xl text-emerald-600 tracking-tight">VeggieMap</h1>
                    <MobilePreferencesMenu />
                </header>

                <div className="flex-1 w-full h-full relative pt-[68px] md:pt-0">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav
                className="md:hidden fixed bottom-6 left-6 right-6 bg-black/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/10 dark:border-zinc-700 text-white rounded-full flex justify-around items-center p-2 shadow-2xl safe-area-pb transition-all duration-300"
                style={{ zIndex: 100 }}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isNav = navigatingTo === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
                            disabled={!!navigatingTo}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/40 -translate-y-2 scale-110"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {isNav ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            )}
                            {isActive && (
                                <span className="absolute -bottom-6 text-[10px] font-bold text-black dark:text-white opacity-0 animate-in fade-in slide-in-from-bottom-2">
                                    {item.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Report Bug FAB — bottom-right, above bottom nav on mobile */}
            <button
                onClick={() => setIsBugModalOpen(true)}
                className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[99] flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-xl text-sm font-semibold hover:scale-105 active:scale-95 transition-transform"
                title="Report a Bug"
            >
                <Bug className="w-4 h-4" />
                <span className="hidden sm:inline">Report a Bug</span>
            </button>

            <ReportBugModal open={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
        </div>
    );
}