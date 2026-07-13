"use client";

import { useEffect, useState, useRef } from "react";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Map as MapIcon, Heart, User, Settings, Bug, ChevronLeft, ChevronRight } from "lucide-react";
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navigate = (href: string) => {
        if (pathname === href) return;
        router.push(href);
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (user.requiresCompletion) {
                router.push("/auth/vendor-completion");
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
                className={cn(
                    "hidden md:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 transition-all duration-300 ease-in-out relative",
                    isSidebarOpen ? "w-72" : "w-20"
                )}
                style={{ zIndex: 100 }}
            >
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-4 top-8 rounded-full w-8 h-8 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hidden md:flex hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
                    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>

                <div className={cn("border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden", isSidebarOpen ? "p-8" : "py-8 px-4 flex justify-center")}>
                    {isSidebarOpen ? (
                        <>
                            <h1 className="font-extrabold text-2xl text-green-600 tracking-tight whitespace-nowrap">VeggieMap</h1>
                            <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Fresh & Local</p>
                        </>
                    ) : (
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-extrabold text-xl">V</span>
                        </div>
                    )}
                </div>

                <nav className={cn("flex-1 space-y-3 overflow-y-auto overflow-x-hidden", isSidebarOpen ? "p-6" : "p-3")}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                title={!isSidebarOpen ? item.name : undefined}
                                className={cn(
                                    "flex items-center gap-4 rounded-2xl text-base font-semibold transition-all duration-200 group text-left",
                                    isSidebarOpen ? "w-full px-5 py-4" : "w-14 h-14 justify-center mx-auto",
                                    isActive
                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110",
                                        isActive ? "fill-current" : ""
                                    )}
                                />
                                {isSidebarOpen && (
                                    <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                                        {item.name}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className={cn("border-t border-zinc-200 dark:border-zinc-800 space-y-6 transition-all duration-300", isSidebarOpen ? "p-6" : "py-6 px-3 flex flex-col items-center")}>
                    <div className="flex flex-col gap-4 w-full">
                        {isSidebarOpen && <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 whitespace-nowrap">Preferences</span>}
                        <div className={cn("flex gap-3", isSidebarOpen ? "flex-col" : "flex-col items-center")}>
                            {isSidebarOpen ? (
                                <GoogleTranslate />
                            ) : (
                                <Button variant="ghost" size="icon" className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 shrink-0" title="Translate">
                                    <Settings className="w-5 h-5 text-zinc-500" />
                                </Button>
                            )}
                            <div className={cn("flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-all shrink-0", isSidebarOpen ? "p-2.5" : "p-2 w-14 h-14 justify-center rounded-2xl")}>
                                {isSidebarOpen && <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Dark Mode</span>}
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

                    <div className={cn("flex items-center gap-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 transition-all duration-300 shrink-0", isSidebarOpen ? "p-3 w-full" : "p-2 w-14 h-14 justify-center mx-auto shrink-0")}>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-zinc-500 truncate font-medium">Consumer Account</p>
                            </div>
                        )}
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

                <div className="flex-1 w-full relative pt-[68px] md:pt-0 flex flex-col">
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
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
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
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}