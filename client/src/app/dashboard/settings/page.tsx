"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Store, MapPin, Shield, Save, Truck, Edit2, X, Clock, ArrowRight, Upload, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Dynamically import Map for Location Tab (Client-side only)
const StaticLocationPicker = dynamic(() => import("@/components/map/StaticLocationPicker"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
});

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<"profile" | "location" | "security">("profile");
    const [isLoading, setIsLoading] = useState(false);


    // --- Profile State ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);

    // Initial State (Source of Truth)
    const [initialProfile, setInitialProfile] = useState({
        vendorName: "",
        shopName: "",
        shopImage: "", // NEW
        phoneNumber: "",
        email: "",
        deliveryAvailable: false,
        businessHours: { start: "09:00", end: "21:00", isOpen: true }
    });

    // Form State (Mutable)
    const [profile, setProfile] = useState(initialProfile);

    // --- Password State ---
    const [security, setSecurity] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });


    useEffect(() => {
        if (user) {
            // Priority: Specific Backend Field -> Frontend Normalized Field -> Empty
            const data = {
                vendorName: user.vendorName || user.name || "",
                shopName: user.shopName || "",
                shopImage: (user as any).shopImage || "", // NEW
                phoneNumber: user.phoneNumber || (user as any).phone || "",
                email: user.email || "",
                deliveryAvailable: (user as any).deliveryAvailable || false,
                businessHours: (user as any).businessHours || { start: "09:00", end: "21:00", isOpen: true }
            };
            setInitialProfile(data);
            setProfile(data);
        }
    }, [user]);

    const cancelProfileEdit = () => {
        setProfile(initialProfile);
        setIsEditingProfile(false);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.put("/vendor/settings/profile", profile);
            updateUser({ ...user, ...response.data }); // Update local context
            setInitialProfile(profile); // Update source of truth
            toast.success("Profile updated successfully!");
            setIsEditingProfile(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (security.newPassword !== security.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        setIsLoading(true);

        try {
            // NOTE: Backend checks current password match
            await api.put("/vendor/settings/password", {
                currentPassword: security.currentPassword,
                newPassword: security.newPassword
            });
            toast.success("Password changed successfully.");
            setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationSave = async (lat: number, lng: number) => {
        try {
            await api.put("/vendor/settings/location", { coordinates: [lng, lat] });
            // Update local user context with new location
            if (user) {
                updateUser({
                    ...user,
                    location: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    }
                });
            }
            toast.success("Shop location updated!");
            setIsEditingLocation(false); // Exit edit mode
        } catch (error) {
            toast.error("Failed to save location.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Store Settings</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Manage your shop profile, location, and security.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
                {[
                    { id: "profile", label: "Profile", icon: Store },
                    { id: "location", label: "Location", icon: MapPin },
                    { id: "security", label: "Security", icon: Shield },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-white dark:bg-zinc-700 text-green-600 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>



            {/* PROFILE TAB */}
            {activeTab === "profile" && (
                <form onSubmit={handleProfileUpdate} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 relative shadow-sm">

                    {/* Header with Edit Action */}
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">General Information</h3>
                            <p className="text-sm text-zinc-500">Your public shop details.</p>
                        </div>
                        {!isEditingProfile ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="gap-2 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={cancelProfileEdit} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md hover:shadow-lg transition-all">
                                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Image Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider w-full">Shop Logo</Label>
                            <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                                {profile.shopImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={profile.shopImage} alt="Shop Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Store className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                                )}

                                {isEditingProfile && (
                                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="text-white text-xs font-medium flex flex-col items-center gap-1">
                                            <Upload className="w-4 h-4" />
                                            <span>Upload</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                setIsLoading(true);
                                                const formData = new FormData();
                                                formData.append("image", file);

                                                try {
                                                    const res = await api.post("/upload", formData, {
                                                        headers: { "Content-Type": "multipart/form-data" },
                                                    });
                                                    // Construct full URL
                                                    const fullUrl = `http://localhost:5000${res.data.filePath}`;
                                                    setProfile({ ...profile, shopImage: fullUrl });
                                                } catch (err) {
                                                    console.error("Upload failed", err);
                                                    toast.error("Failed to upload image.");
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400 text-center max-w-[200px]">
                                Upload a clear logo or shop photo.<br />Visible to customers.
                            </p>
                        </div>

                        {/* Right Column: Text Inputs */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">My Name</Label>
                                {isEditingProfile ? (
                                    <Input
                                        value={profile.vendorName}
                                        onChange={(e) => setProfile({ ...profile, vendorName: e.target.value })}
                                        required
                                        className="border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500 transition-all bg-zinc-50 dark:bg-zinc-800/50"
                                        placeholder="Your Name"
                                    />
                                ) : (
                                    <div className="text-zinc-900 dark:text-white font-medium text-base py-2">
                                        {profile.vendorName || <span className="text-zinc-400 italic">Not set</span>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Shop Name (Public)</Label>
                                {isEditingProfile ? (
                                    <Input
                                        value={profile.shopName}
                                        onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
                                        className="border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500 transition-all bg-zinc-50 dark:bg-zinc-800/50"
                                        placeholder="e.g. Ramu's Fresh Veggies"
                                    />
                                ) : (
                                    <div className="text-zinc-900 dark:text-white font-medium text-base py-2">
                                        {profile.shopName || <span className="text-zinc-400 italic">Not set</span>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Phone Number</Label>
                                {isEditingProfile ? (
                                    <Input
                                        value={profile.phoneNumber}
                                        onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                        required
                                        className="border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500 transition-all bg-zinc-50 dark:bg-zinc-800/50"
                                        placeholder="Mobile Number"
                                    />
                                ) : (
                                    <div className="text-zinc-900 dark:text-white font-medium text-base py-2">
                                        {profile.phoneNumber || <span className="text-zinc-400 italic">Not set</span>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Email</Label>
                                {isEditingProfile ? (
                                    <Input
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500 transition-all bg-zinc-50 dark:bg-zinc-800/50"
                                        placeholder="Email Address"
                                    />
                                ) : (
                                    <div className="text-zinc-900 dark:text-white font-medium text-base py-2">
                                        {profile.email || <span className="text-zinc-400 italic">Not set</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Business Hours */}
                            <div className="space-y-4">
                                <Label className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                                    <Clock className="w-4 h-4 text-green-600" /> Business Hours
                                </Label>

                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                                    {isEditingProfile ? (
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs text-zinc-500">Opening Time</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={profile.businessHours.start}
                                                        onChange={(e) => setProfile({ ...profile, businessHours: { ...profile.businessHours, start: e.target.value } })}
                                                        className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-6 text-zinc-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs text-zinc-500">Closing Time</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={profile.businessHours.end}
                                                        onChange={(e) => setProfile({ ...profile, businessHours: { ...profile.businessHours, end: e.target.value } })}
                                                        className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="text-zinc-900 dark:text-white font-medium flex items-center gap-2">
                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-sm">
                                                    {profile.businessHours.start}
                                                </span>
                                                <span className="text-zinc-400 text-sm">to</span>
                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
                                                    {profile.businessHours.end}
                                                </span>
                                            </div>
                                            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/30">
                                                Open Daily
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* LOCATION TAB */}
            {activeTab === "location" && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Shop Location</h3>
                            <p className="text-sm text-zinc-500">
                                {isEditingLocation
                                    ? "Drag the map or click to set your new location."
                                    : "This is your shop's location visible to customers."}
                            </p>
                        </div>
                        {!isEditingLocation ? (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingLocation(true)} className="gap-2 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                <Edit2 className="w-4 h-4" /> Edit Location
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingLocation(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className={cn(
                        "transition-all duration-300 ease-in-out",
                        isEditingLocation ? "opacity-100" : "opacity-90"
                    )}>
                        <StaticLocationPicker
                            initialLat={user?.location?.coordinates?.[1]}
                            initialLng={user?.location?.coordinates?.[0]}
                            onSave={handleLocationSave}
                            onCancel={() => setIsEditingLocation(false)}
                            readOnly={!isEditingLocation}
                        />
                    </div>
                </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
                <form onSubmit={handlePasswordUpdate} className="max-w-md space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-zinc-500">Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.current ? "text" : "password"}
                                    value={security.currentPassword}
                                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                                    required
                                    placeholder="Enter current password"
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-zinc-500">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.new ? "text" : "password"}
                                    value={security.newPassword}
                                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                    required
                                    placeholder="Enter new password"
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-zinc-500">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={security.confirmPassword}
                                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                    required
                                    placeholder="Repeat new password"
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading} variant="destructive" className="w-full">
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                        Update Password
                    </Button>
                </form>
            )}
        </div>
    );
}
