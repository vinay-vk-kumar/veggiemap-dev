"use client";

import { toast } from "sonner";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, User, ArrowRight, Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
    const [role, setRole] = useState<"consumer" | "vendor">("consumer");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    // Form States
    const [formData, setFormData] = useState({
        name: "", // consumer name or vendorName
        shopName: "", // NEW: Shop Name
        email: "",
        phoneNumber: "", // consumer or vendor phone
        password: "",
        vendorType: "mobile", // 'mobile' or 'static'
        location: null as { lat: number, lng: number } | null
    });

    const { login } = useAuth();
    const router = useRouter();

    const handleLocationAccess = () => {
        setLocationStatus("loading");
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLocationStatus("error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }));
                setLocationStatus("success");
            },
            (err) => {
                console.error(err);
                setError("Unable to retrieve your location");
                setLocationStatus("error");
            }
        );
    };

    const validateForm = () => {
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }

        // Phone Number Validation (Vendor Only)
        if (role === "vendor") {
            const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
            if (!formData.phoneNumber) {
                toast.error("Phone number is required for vendors.");
                return false;
            }
            if (!phoneRegex.test(formData.phoneNumber)) {
                toast.error("Please enter a valid 10-digit mobile number.");
                return false;
            }
        }

        // Password Length
        if (formData.password.length < 6) {
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
            if (role === "vendor" && !formData.location) {
                throw new Error("Location permission is required for vendors.");
            }

            const endpoint = role === "vendor" ? "/auth/vendor/register" : "/auth/consumer/register";

            const payload = role === "vendor" ? {
                vendorName: formData.name, // Personal Name
                shopName: formData.shopName, // Shop Name
                email: formData.email,
                phoneNumber: "+91" + formData.phoneNumber,
                password: formData.password,
                vendorType: formData.vendorType,
                location: {
                    coordinates: [formData.location!.lng, formData.location!.lat] // [lng, lat] for GeoJSON
                }
            } : {
                name: formData.name,
                email: formData.email,
                password: formData.password
            };

            const response = await api.post(endpoint, payload);
            const { token, ...userData } = response.data;

            login(token, userData);
            router.push("/");

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
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
                    <span className="font-medium text-sm">Join as Customer</span>
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
                    <span className="font-medium text-sm">Join as Vendor</span>
                </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {role === "vendor" ? "Desi/Shop Name" : "Full Name"}
                    </label>
                    <div className="mt-1">
                        <input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700"
                            placeholder={role === "vendor" ? "e.g. Ramu's Fresh Veggies" : "e.g. Vinay Kumar"}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700"
                        />
                    </div>

                    {role === "vendor" && (
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Phone Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700"
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {role === "vendor" && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Vendor Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="vendorType"
                                    value="mobile"
                                    checked={formData.vendorType === "mobile"}
                                    onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Mobile (Cart)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="vendorType"
                                    value="static"
                                    checked={formData.vendorType === "static"}
                                    onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Static (Shop)</span>
                            </label>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Password
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {role === "vendor" && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Initial Location
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLocationAccess}
                            className={cn("w-full gap-2", locationStatus === "success" && "border-green-500 text-green-600")}
                        >
                            {locationStatus === "loading" ? <Loader2 className="animate-spin w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            {locationStatus === "success" ? "Location Captured!" : "Allow Location Access"}
                        </Button>
                        <p className="text-xs text-zinc-500 mt-1">Required to show you on the map initially.</p>
                    </div>
                )}

                <div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-11"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500 text-sm">
                    Already have an account? Sign In
                </Link>
            </div>
        </div>
    );
}
