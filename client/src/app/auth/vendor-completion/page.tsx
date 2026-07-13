"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, Store, ArrowRight, Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorCompletionPage() {
    const { user, login } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        shopName: user?.shopName || "",
        phoneNumber: "",
        password: "",
        vendorType: "mobile"
    });

    const [showPassword, setShowPassword] = useState(false);
    const [location, setLocation] = useState<{ coordinates: [number, number] } | null>(null);
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    useEffect(() => {
        // Redirect if not logged in or if completion isn't actually required
        if (!user) {
            router.push("/auth/signin");
        } else if (!user.requiresCompletion) {
            router.push("/dashboard");
        }
    }, [user, router]);

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
            if (!formData.shopName.trim()) {
                toast.error("Shop Name is required");
                return;
            }
            if (!formData.phoneNumber.trim()) {
                toast.error("Phone number is required");
                return;
            }
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                toast.error("Please enter a valid 10-digit mobile number.");
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                toast.error("Please set a password (min 6 characters)");
                return;
            }
            setStep(2);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!location) {
            setError("Please allow location access to continue.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/vendor/completion", {
                userId: user?.userId,
                ...formData,
                location
            });

            const { token, ...userData } = response.data;
            login(token, userData); // This removes the requiresCompletion flag
            router.push("/dashboard");
            toast.success("Profile completed successfully!");

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to complete profile";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || !user.requiresCompletion) return null; // Let the useEffect redirect handle it

    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
                    Almost there!
                </h2>
                <p className="text-zinc-500 font-medium">
                    We just need a few more details to set up your shop.
                </p>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                    {error}
                </div>
            )}

            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Shop Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.shopName}
                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder="e.g. Ramu's Fresh Veggies"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-base h-14 px-4 transition-all"
                            placeholder="e.g. 9876543210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Set a Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="block w-full rounded-[16px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:border-green-500 focus:ring-green-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-base h-14 px-4 pr-12 transition-all"
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
                            className="w-full h-14 rounded-[16px] text-lg font-bold shadow-xl transition-all active:scale-[0.98] text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Continue <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
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

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                            className="w-1/3 flex justify-center items-center rounded-[16px] h-14 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all font-bold"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 flex justify-center items-center py-4 px-4 rounded-[16px] shadow-xl shadow-green-600/20 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 h-14 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Profile"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
