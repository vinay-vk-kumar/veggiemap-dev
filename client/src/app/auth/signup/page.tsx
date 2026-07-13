"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, User, ArrowRight, Loader2, Eye, EyeOff, MapPin, Store, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleLogin } from "@react-oauth/google";

export default function SignUpPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"consumer" | "vendor">("consumer");

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        shopName: "", // Optional for vendor
        email: "",
        password: "",
        phoneNumber: "",
        vendorType: "mobile",
    });

    const [otp, setOtp] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Location State
    const [location, setLocation] = useState<{ coordinates: [number, number] } | null>(null);
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

    const handleLocationAccess = () => {
        setLocationStatus("loading");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        coordinates: [position.coords.longitude, position.coords.latitude]
                    });
                    setLocationStatus("success");
                    toast.success("Location captured successfully!");
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationStatus("error");
                    toast.error("Failed to get location. Please enable location services.");
                }
            );
        } else {
            setLocationStatus("error");
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    const nextStep = () => {
        setError("");
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!formData.name.trim() || !formData.email.trim()) {
                toast.error("Please fill in all required fields.");
                return;
            }

            if (formData.name.trim().length < 3) {
                toast.error("Name must be at least 3 characters long.");
                return;
            }

            if (/\d/.test(formData.name)) {
                toast.error("Name cannot contain numbers.");
                return;
            }

            if (role === "vendor") {
                if (!formData.shopName.trim()) {
                    toast.error("Shop Name is required for vendors.");
                    return;
                }
                if (formData.shopName.trim().length < 3) {
                    toast.error("Shop Name must be at least 3 characters long.");
                    return;
                }
                if (/\d/.test(formData.shopName)) {
                    toast.error("Shop Name cannot contain numbers.");
                    return;
                }
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error("Please enter a valid email address.");
                return;
            }

            if (role === "consumer") {
                if (!formData.password || formData.password.length < 6) {
                    toast.error("Password must be at least 6 characters long.");
                    return;
                }
                handleSubmit();
            } else {
                setStep(3);
            }
        } else if (step === 3 && role === "vendor") {
            if (!formData.phoneNumber || !formData.password) {
                toast.error("Please fill in phone number and password.");
                return;
            }

            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                toast.error("Please enter a valid 10-digit mobile number.");
                return;
            }

            if (formData.password.length < 6) {
                toast.error("Password must be at least 6 characters long.");
                return;
            }

            setStep(4);
        }
    };

    const prevStep = () => {
        setError("");
        setStep(step - 1);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (role === "vendor" && !location) {
            setError("Please allow location access to continue.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const endpoint = role === "vendor" ? "/auth/vendor/register" : "/auth/consumer/register";
            const payload = role === "vendor"
                ? {
                    vendorName: formData.name,
                    shopName: formData.shopName || formData.name,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber.startsWith("+91") ? formData.phoneNumber : "+91" + formData.phoneNumber,
                    vendorType: formData.vendorType,
                    location: location,
                }
                : {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                };

            const response = await api.post(endpoint, payload);
            
            if (response.data.requiresVerification) {
                toast.success(response.data.message);
                setStep(5);
                return;
            }

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
            const msg = err.response?.data?.message || "Something went wrong. Please try again.";
            setError(msg);
            toast.error(msg);
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
                email: formData.email,
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
            {step > 1 && (
                <button
                    onClick={prevStep}
                    className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
            )}

            <div className="mb-5">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-1">
                    {step === 1 ? "Join VeggieMap" : step === 2 ? "Account Details" : step === 5 ? "Verify Email" : "Shop Details"}
                </h2>
                <p className="text-zinc-500 font-medium">
                    {step === 1 ? "Choose your account type to get started." :
                        step === 2 ? "Fill in your basic information." :
                        step === 5 ? "Enter the verification code sent to your email." :
                            "Tell us a bit about your business."}
                </p>

                {/* Stepper Progress */}
                <div className="flex items-center gap-2 mt-4">
                    <div className={cn("h-2 rounded-full flex-1 transition-all", step >= 1 ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                    <div className={cn("h-2 rounded-full flex-1 transition-all", step >= 2 ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                    {role === "vendor" && (
                        <>
                            <div className={cn("h-2 rounded-full flex-1 transition-all", step >= 3 ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                            <div className={cn("h-2 rounded-full flex-1 transition-all", step >= 4 ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                    {error}
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="grid gap-3">
                        <button
                            onClick={() => setRole("consumer")}
                            className={cn(
                                "flex items-center gap-5 p-6 rounded-[24px] border-2 transition-all text-left",
                                role === "consumer"
                                    ? "border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_8px_16px_rgba(34,197,94,0.15)]"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900"
                            )}
                        >
                            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shrink-0", role === "consumer" ? "bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className={cn("font-bold text-lg mb-1", role === "consumer" ? "text-green-800 dark:text-green-300" : "text-zinc-900 dark:text-white")}>Customer</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">Find local fresh produce and track mobile carts nearby.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setRole("vendor")}
                            className={cn(
                                "flex items-center gap-5 p-6 rounded-[24px] border-2 transition-all text-left",
                                role === "vendor"
                                    ? "border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_8px_16px_rgba(34,197,94,0.15)]"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900"
                            )}
                        >
                            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shrink-0", role === "vendor" ? "bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                                <Truck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className={cn("font-bold text-lg mb-1", role === "vendor" ? "text-green-800 dark:text-green-300" : "text-zinc-900 dark:text-white")}>Vendor</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">Register your shop or cart to reach more local customers.</p>
                            </div>
                        </button>
                    </div>

                    <Button onClick={nextStep} className="w-full h-14 rounded-[16px] text-lg font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]">
                        Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="w-full flex justify-center pt-2">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    setIsLoading(true);
                                    const response = await api.post("/auth/google/login", { 
                                        credential: credentialResponse.credential,
                                        role: role,
                                        action: "signup"
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
                                    toast.error(err.response?.data?.message || "Google signup failed");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            onError={() => {
                                toast.error("Google Signup Failed");
                            }}
                            theme="filled_black"
                            size="large"
                            shape="pill"
                            text="signup_with"
                            width="100%"
                        />
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-zinc-50 dark:bg-black px-4 text-zinc-500 font-medium">
                                Or register with email
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            {role === "vendor" ? "Shop Owner Name" : "Full Name"}
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder={role === "vendor" ? "e.g. Ramu" : "e.g. John Doe"}
                        />
                    </div>

                    {role === "vendor" && (
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Shop Name
                            </label>
                            <input
                                type="text"
                                value={formData.shopName}
                                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                                placeholder="e.g. Ramu's Fresh Veggies"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    {role === "consumer" && (
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    )}

                    <div className="pt-2">
                        <Button
                            onClick={nextStep}
                            disabled={isLoading}
                            className={cn("w-full h-14 rounded-[16px] text-lg font-bold shadow-xl transition-all active:scale-[0.98]",
                                role === "consumer" ? "text-white bg-gradient-to-br from-green-500 to-green-700 shadow-green-600/20 hover:from-green-600 hover:to-green-800"
                                    : "text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                            )}
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                role === "consumer" ? "Create Account" : "Continue"}
                        </Button>
                    </div>
                </div>
            )}

            {step === 3 && role === "vendor" && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white caret-green-500 placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder="e.g. 9876543210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                            onClick={nextStep}
                            disabled={isLoading}
                            className="w-full h-14 rounded-[16px] text-lg font-bold shadow-xl transition-all active:scale-[0.98] text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {step === 4 && role === "vendor" && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">
                            How do you operate?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, vendorType: "mobile" })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 p-6 rounded-[20px] border-2 transition-all text-center active:scale-[0.98]",
                                    formData.vendorType === "mobile"
                                        ? "border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_8px_16px_rgba(34,197,94,0.15)] text-green-700 dark:text-green-400"
                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900 text-zinc-500"
                                )}
                            >
                                <Truck className={cn("w-8 h-8", formData.vendorType === "mobile" ? "text-green-600" : "")} />
                                <span className="font-bold text-sm">Mobile Cart</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, vendorType: "static" })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 p-6 rounded-[20px] border-2 transition-all text-center active:scale-[0.98]",
                                    formData.vendorType === "static"
                                        ? "border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_8px_16px_rgba(34,197,94,0.15)] text-green-700 dark:text-green-400"
                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-green-200 dark:hover:border-green-900 text-zinc-500"
                                )}
                            >
                                <Store className={cn("w-8 h-8", formData.vendorType === "static" ? "text-green-600" : "")} />
                                <span className="font-bold text-sm">Static Shop</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Set Initial Location
                        </label>
                        <p className="text-sm text-zinc-500 mb-4">We need your location so customers can find you on the map right away.</p>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLocationAccess}
                            className={cn("w-full gap-2 h-16 rounded-[16px] text-base transition-all active:scale-[0.98]",
                                locationStatus === "success"
                                    ? "border-green-500 bg-green-50/50 dark:bg-green-500/10 text-green-600 shadow-[0_4px_12px_rgba(34,197,94,0.1)]"
                                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            {locationStatus === "loading" ? <Loader2 className="animate-spin w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                            {locationStatus === "success" ? "Location Captured!" : "Allow Location Access"}
                        </Button>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 h-14 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
                        </Button>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-4">
                            <Store className="w-8 h-8" />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">We've sent a 6-digit code to <br/><span className="font-bold text-zinc-900 dark:text-white">{formData.email}</span></p>
                    </div>

                    <div>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-center text-3xl tracking-[0.5em] h-16 transition-all font-mono"
                            placeholder="------"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleVerifyOTP}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 h-14 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Continue"}
                        </Button>
                    </div>
                    
                    <div className="text-center mt-4">
                        <button 
                            type="button" 
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    await api.post("/auth/otp/send", { email: formData.email, purpose: "verify-email" });
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
            )}

            {step === 1 && (
                <div className="mt-5 text-center">
                    <Link href="/auth/signin" className="font-bold text-green-600 hover:text-green-500 text-sm">
                        Already have an account? <span className="underline underline-offset-2">Sign In</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
