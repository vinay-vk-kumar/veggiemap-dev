"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type UserRole = "consumer" | "vendor" | null;

interface User {
    _id: string;
    name: string;
    vendorName?: string; // Specific to vendors
    email?: string;
    role: UserRole;
    userId?: string;
    vendorType?: "mobile" | "static"; // Specific to vendors
    isOnline?: boolean;
    shopName?: string; // NEW
    phoneNumber?: string; // NEW
    deliveryAvailable?: boolean; // NEW
    businessHours?: { start: string; end: string; isOpen: boolean }; // NEW
    location?: {
        type: "Point",
        coordinates: [number, number]; // [lng, lat]
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: UserRole;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Hydrate auth state from localStorage
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setRole(parsedUser.role);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        setRole(userData.role);

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, token, role, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
