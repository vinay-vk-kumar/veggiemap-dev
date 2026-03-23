"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "secret-admin-a7f3k2";

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        if (!token) {
            router.replace(`/${adminPath}`);
        }
    }, [router, adminPath]);

    return <>{children}</>;
}
