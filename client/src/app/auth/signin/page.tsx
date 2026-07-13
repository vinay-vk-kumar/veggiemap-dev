"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignInPage() {
    const [role, setRole] = useState<"consumer" | "vendor">("consumer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { login, user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && user) {
            if (user.role === "vendor") {
                router.push("/dashboard");
            } else {
                router.push("/map");
            }
        }
    }, [user, isAuthLoading, router]);

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);
        setError("");

        try {
            const endpoint = role === "vendor" ? "/auth/vendor/login" : "/auth/consumer/login";
            const response = await api.post(endpoint, { email, password });

            // Backend should return { token, ...userData }
            // According to analysis:
            // Vendor: { _id, vendorName, vendorType, role: 'vendor', userId, token }
            // Consumer: { _id, name, role: 'consumer', token }

            const { token, ...userData } = response.data;

            login(token, userData);

            // Redirect based on role
            // Check userData.role because the selected 'role' state might be different if the API returns normalized data?
            // Actually, rely on the API response or the 'role' we sent if we trust the flow.
            // But userData.role is safest.
            const userRole = userData.role || role; // Fallback to state if not in response

            if (userRole === "vendor") {
                router.push("/dashboard");
            } else {
                router.push("/map");
            }

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthLoading || user) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">Preparing your experience...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">Welcome Back</h2>
                <p className="text-zinc-500 font-medium">Please sign in to your account.</p>
            </div>

            {/* Role Toggles */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setRole("consumer")}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all active:scale-[0.98]",
                        role === "consumer"
                            ? "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 shadow-[0_8px_16px_rgba(34,197,94,0.15)]"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                >
                    <User className={cn("w-7 h-7", role === "consumer" ? "text-green-600" : "")} />
                    <span className="font-bold">Customer</span>
                </button>
                <button
                    onClick={() => setRole("vendor")}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all active:scale-[0.98]",
                        role === "vendor"
                            ? "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 shadow-[0_8px_16px_rgba(34,197,94,0.15)]"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                >
                    <Truck className={cn("w-7 h-7", role === "vendor" ? "text-green-600" : "")} />
                    <span className="font-bold">Vendor</span>
                </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-base h-14 px-4 pr-12 transition-all"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-4 px-4 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-14 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>Sign In <ArrowRight className="w-5 h-5 ml-2" /></>
                        )}
                    </Button>
                </div>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-zinc-50 dark:bg-black px-4 text-zinc-500 font-medium">
                            New to VeggieMap?
                        </span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/auth/signup" className="font-medium text-green-600 hover:text-green-500">
                        Create a {role} account
                    </Link>
                </div>
            </div>
        </div>
    );
}
