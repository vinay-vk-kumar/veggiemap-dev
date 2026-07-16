"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { usePathname } from "next/navigation";

function CaptchaHider() {
    const pathname = usePathname();
    // Hide the badge on all pages EXCEPT those starting with /auth
    if (!pathname?.startsWith("/auth")) {
        return <style>{`.grecaptcha-badge { visibility: hidden !important; }`}</style>;
    }
    return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-client-id.apps.googleusercontent.com";
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
    
    return (
        <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
            <CaptchaHider />
            <GoogleOAuthProvider clientId={clientId}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </GoogleOAuthProvider>
        </GoogleReCaptchaProvider>
    );
}
