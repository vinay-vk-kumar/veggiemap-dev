"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import VendorList from "@/components/consumer/VendorList";

// Lazy Load Map
const ConsumerMapV3 = dynamic(
    () => import("@/components/map/ConsumerMapV3"),
    {
        loading: () => (
            <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        ),
        ssr: false
    }
);

export default function ConsumerLayout() {
    return (
        <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden">
            {/* Right: Map (Adaptive) */}
            <div className="w-full h-full relative">
                <ConsumerMapV3 />

                {/* Mobile: Floating List Button (Todo) */}
            </div>
        </div>
    );
}
