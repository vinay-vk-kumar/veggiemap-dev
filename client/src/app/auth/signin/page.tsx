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
import { GoogleLogin } from "@react-oauth/google";

export default function SignInPage() {
    const [role, setRole] = useState<"consumer" | "vendor">("consumer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // OTP Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState("");

    const { login, user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && user) {
            if (user.requiresCompletion) {
                router.push("/auth/vendor-completion");
            } else if (user.role === "vendor") {
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

            // Vendor: { _id, vendorName, vendorType, role: 'vendor', userId, token }
            // Consumer: { _id, name, role: 'consumer', token }

            const { token, ...userData } = response.data;

            login(token, userData);

            const userRole = userData.role || role; // Fallback to state if not in response

            if (userRole === "vendor") {
                router.push("/dashboard");
            } else {
                router.push("/map");
            }

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Invalid credentials. Please try again.";

            if (err.response?.data?.requiresVerification) {
                try {
                    await api.post("/auth/otp/send", { email, purpose: "verify-email" });
                    toast.success("A verification code has been sent to your email.");
                    setIsVerifying(true);
                } catch (sendErr: any) {
                    toast.error(sendErr.response?.data?.message || "Failed to send verification code.");
                }
            } else {
                setError(msg);
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/otp/verify", {
                email,
                otp,
                purpose: "verify-email"
            });

            const { token, ...userData } = response.data;
            login(token, userData);

            const userRole = userData.role || role;
            if (userRole === "vendor") {
                router.push("/dashboard");
            } else {
                router.push("/map");
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Invalid OTP";
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
            <div className="mb-5">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-1">Welcome Back</h2>
                <p className="text-zinc-500 font-medium">Please sign in to your account.</p>
            </div>

            {/* Role Toggles - Segmented Control */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-[16px] mb-5">
                <button
                    onClick={() => setRole("consumer")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] transition-all font-bold text-sm active:scale-[0.98]",
                        role === "consumer"
                            ? "bg-white dark:bg-zinc-900 shadow-sm text-green-600 dark:text-green-400 border border-black/5 dark:border-white/5"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                >
                    <User className="w-4 h-4" /> Customer
                </button>
                <button
                    onClick={() => setRole("vendor")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] transition-all font-bold text-sm active:scale-[0.98]",
                        role === "vendor"
                            ? "bg-white dark:bg-zinc-900 shadow-sm text-green-600 dark:text-green-400 border border-black/5 dark:border-white/5"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                >
                    <Truck className="w-4 h-4" /> Vendor
                </button>
            </div>

            {isVerifying ? (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Verify Your Email</h3>
                        <p className="text-zinc-500 text-sm">We've sent a 6-digit code to <br /><span className="font-medium text-zinc-900 dark:text-zinc-300">{email}</span></p>
                    </div>

                    <div>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-center text-3xl tracking-[0.5em] h-16 transition-all font-mono"
                            placeholder="------"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleVerifyOTP}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 h-14 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Sign In"}
                        </Button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    await api.post("/auth/otp/send", { email, purpose: "verify-email" });
                                    toast.success("A new OTP has been sent!");
                                } catch (err: any) {
                                    toast.error(err.response?.data?.message || "Failed to resend OTP");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="text-sm font-bold text-green-600 hover:text-green-700"
                        >
                            Resend Code
                        </button>
                    </div>
                </div>
            ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="w-full flex justify-center pt-2">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    setIsLoading(true);
                                    const response = await api.post("/auth/google/login", {
                                        credential: credentialResponse.credential,
                                        role: role,
                                        action: "signin"
                                    });
                                    const { token, ...userData } = response.data;
                                    login(token, userData);
                                    if (userData.requiresCompletion) {
                                        router.push("/auth/vendor-completion");
                                    } else if (userData.role === "vendor") {
                                        router.push("/dashboard");
                                    } else {
                                        router.push("/map");
                                    }
                                } catch (err: any) {
                                    toast.error(err.response?.data?.message || "Google login failed");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            onError={() => {
                                toast.error("Google Login Failed");
                            }}
                            theme="filled_black"
                            size="large"
                            shape="pill"
                            text="continue_with"
                            width="100%"
                        />
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-zinc-50 dark:bg-black px-4 text-zinc-500 font-medium">
                                Or continue with email
                            </span>
                        </div>
                    </div>

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
                        <div className="flex justify-between items-end mb-2">
                            <label htmlFor="password" className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Password
                            </label>
                            <Link href="/auth/forgot-password" className="text-sm font-semibold text-green-600 hover:text-green-500">
                                Forgot Password?
                            </Link>
                        </div>
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
            )}

            <div className="mt-5">
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

                <div className="mt-4 text-center">
                    <Link href="/auth/signup" className="font-medium text-green-600 hover:text-green-500">
                        Create a {role} account
                    </Link>
                </div>
            </div>
        </div>
    );
}
