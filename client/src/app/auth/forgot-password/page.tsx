"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Eye, EyeOff, KeyRound, ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form fields
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.error("Please enter your email address.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post("/auth/otp/send", { email, purpose: "reset-password" });
            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp.trim() || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post("/auth/otp/verify", {
                email,
                otp,
                newPassword,
                purpose: "reset-password"
            });
            
            toast.success("Password reset successfully! You can now sign in.");
            router.push("/auth/signin");
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Invalid OTP or failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                {step === 1 && (
                    <button
                        type="button"
                        onClick={() => router.push("/auth/signin")}
                        className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-6"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Sign In
                    </button>
                )}
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-[20px] flex items-center justify-center mb-6">
                    <KeyRound className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
                    {step === 1 ? "Reset Password" : "Enter OTP"}
                </h2>
                <p className="text-zinc-500 font-medium">
                    {step === 1 
                        ? "Enter your email address and we'll send you a verification code."
                        : `We sent a 6-digit code to ${email}.`}
                </p>
            </div>

            {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center h-14 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Code <ArrowRight className="w-5 h-5 ml-2" /></>}
                        </Button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in duration-300 slide-in-from-right-4">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Verification Code (OTP)
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all tracking-[0.5em] font-mono text-center"
                            placeholder="------"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 pr-12 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center h-14 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset Password"}
                        </Button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                        >
                            Change email address
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
