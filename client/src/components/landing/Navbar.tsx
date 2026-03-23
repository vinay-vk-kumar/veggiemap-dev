"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import GoogleTranslate from "./Language";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [authNav, setAuthNav] = useState<string | null>(null);
    const { user, logout } = useAuth();
    const router = useRouter();

    const navLinks = [
        { name: "How it Works", href: "#how-it-works" },
        { name: "Features", href: "#features" },
        { name: "For Vendors", href: "#vendors" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 supports-backdrop-filter:bg-white/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">V</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
                            VeggieMap
                        </span>
                    </Link>

                    {/* Desktop Nav — Left: page links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-zinc-600 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Nav — Right: global controls + user actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Global utilities */}
                        <GoogleTranslate />
                        <ThemeToggle />

                        {/* Visual separator */}
                        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                        {/* User actions */}
                        {user ? (
                            <>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden lg:block">
                                    Hi, {user.name}
                                </span>
                                <Button
                                    onClick={logout}
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                                >
                                    Sign Out
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setIsNavigating(true)}
                                    disabled={isNavigating}
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 min-w-[110px]"
                                    asChild
                                >
                                    <Link href={user.role === 'vendor' ? "/dashboard" : "/map"}>
                                        {isNavigating
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                                            : (user.role === 'vendor' ? 'Dashboard' : 'Explore')
                                        }
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={!!authNav}
                                    onClick={() => { setAuthNav("/auth/signin"); router.push("/auth/signin"); }}
                                >
                                    {authNav === "/auth/signin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!!authNav}
                                    onClick={() => { setAuthNav("/auth/signup"); router.push("/auth/signup"); }}
                                    className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                                >
                                    {authNav === "/auth/signup" ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : "Get Started"}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Theme</span>
                                    <ThemeToggle />
                                </div>
                                {user ? (
                                    <>
                                        <div className="px-1 text-sm text-zinc-500 mb-1">Signed in as {user.name}</div>
                                        <Button
                                            onClick={() => setIsNavigating(true)}
                                            disabled={isNavigating}
                                            className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                                            asChild
                                        >
                                            <Link href={user.role === 'vendor' ? "/dashboard" : "/map"}>
                                                {isNavigating
                                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                                                    : 'Go to Dashboard'
                                                }
                                            </Link>
                                        </Button>
                                        <Button onClick={logout} variant="outline" className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-900/30">
                                            Sign Out
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            disabled={!!authNav}
                                            onClick={() => { setAuthNav("/auth/signin"); router.push("/auth/signin"); }}
                                            className="w-full justify-center"
                                        >
                                            {authNav === "/auth/signin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                                        </Button>
                                        <Button
                                            disabled={!!authNav}
                                            onClick={() => { setAuthNav("/auth/signup"); router.push("/auth/signup"); }}
                                            className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {authNav === "/auth/signup" ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : "Get Started"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
