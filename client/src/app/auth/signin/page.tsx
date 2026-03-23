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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <div className="bg-white dark:bg-zinc-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-200 dark:border-zinc-700">
            {/* Role Toggles */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setRole("consumer")}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        role === "consumer"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-green-200 dark:hover:border-green-900 text-zinc-500"
                    )}
                >
                    <User className="w-6 h-6" />
                    <span className="font-medium text-sm">Customer</span>
                </button>
                <button
                    onClick={() => setRole("vendor")}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        role === "vendor"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-green-200 dark:hover:border-green-900 text-zinc-500"
                    )}
                >
                    <Truck className="w-6 h-6" />
                    <span className="font-medium text-sm">Vendor</span>
                </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Password
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 px-3 py-2 pr-10 bg-white dark:bg-zinc-900 dark:border-zinc-700"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-11"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
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
                        <span className="bg-white dark:bg-zinc-800 px-2 text-zinc-500">
                            New here?
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
