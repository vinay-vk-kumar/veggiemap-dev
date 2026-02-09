"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, LogOut, Save, Loader2, Mail, Edit2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await api.put('/consumer/profile', { name });
            // In a real app, update context here instead of reload
            window.location.reload();
        } catch (error) {
            console.error(error);
            // Add toast here
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-black pb-32 pt-8 px-4">
            <div className="max-w-md mx-auto space-y-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Account</h1>

                {/* Profile Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center text-center">

                    {/* Initials Avatar (No Image Upload) */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
                        {name.charAt(0).toUpperCase()}
                    </div>

                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{name}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{user?.email}</p>

                    <div className="w-full mt-8 space-y-4 text-left">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Display Name</label>
                            <div className="relative">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isEditing}
                                    className={cn(
                                        "pl-10 h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl transition-all",
                                        isEditing && "ring-2 ring-green-500/20 border-green-500"
                                    )}
                                />
                                <User className="w-5 h-5 absolute left-3 top-3.5 text-zinc-400" />
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="absolute right-3 top-3.5 text-green-600 hover:text-green-700 p-1 bg-green-50 dark:bg-green-900/20 rounded-md"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Email Field (ReadOnly) */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative opacity-70">
                                <Input
                                    value={user?.email}
                                    disabled
                                    className="pl-10 h-12 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border-transparent rounded-xl"
                                />
                                <Mail className="w-5 h-5 absolute left-3 top-3.5 text-zinc-400" />
                            </div>
                        </div>

                        {/* Edit Actions */}
                        {isEditing && (
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11 rounded-xl"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 rounded-xl"
                                    onClick={handleSave}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    variant="ghost"
                    className="w-full h-14 bg-white dark:bg-zinc-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 justify-between px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    onClick={logout}
                >
                    <span className="flex items-center gap-3 font-semibold text-base">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                        </div>
                        Sign Out
                    </span>
                </Button>

                <p className="text-center text-xs text-zinc-400">
                    Logged in as <span className="font-medium text-zinc-600 dark:text-zinc-300">{user?.email}</span>
                </p>
            </div>
        </div>
    );
}
