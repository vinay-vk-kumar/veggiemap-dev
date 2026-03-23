"use client";

import { useState, useEffect } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuImageProps {
    src?: string;
    alt: string;
    category?: string;
    previewMode?: boolean;
    className?: string; // Allow external styling overrides
}

export default function MenuImage({ src, alt, category, previewMode = false, className }: MenuImageProps) {
    const [isError, setIsError] = useState(false);

    // Reset error when src changes
    useEffect(() => {
        setIsError(false);
    }, [src]);

    if (!src || isError) {
        return (
            <div className={cn(
                "w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-800 p-2 text-center",
                previewMode ? "flex-col gap-2" : "flex-col gap-1",
                className
            )}>
                {previewMode ? (
                    <>
                        <PackageOpen className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs font-medium">No image selected</span>
                    </>
                ) : (
                    <>
                        <span className="text-2xl">{category === 'fruit' ? '🍎' : '🥦'}</span>
                        {isError && src && (
                            <span className="text-[8px] leading-tight text-red-500 break-all">{src}</span>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            alt={alt}
            className={cn("w-full h-full object-cover", className)}
            onError={() => {
                console.error("Image failed to load:", src);
                setIsError(true);
            }}
        />
    );
}
