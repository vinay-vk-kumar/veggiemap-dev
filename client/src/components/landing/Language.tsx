import React, { useEffect, useState, useRef, useCallback } from "react";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/sheet/BottomSheet";

declare global {
    interface Window {
        google: any;
        googleTranslateInit: () => void;
    }
}

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "mr", name: "Marathi" },
    { code: "bho", name: "Bhojpuri" },
    { code: "or", name: "Odia" },
    { code: "gu", name: "Gujarati" },
];

// Read the active language from the googtrans cookie
const getLangFromCookie = (): string => {
    if (typeof document === "undefined") return "en";
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    return match ? match[1] : "en";
};

const setGoogTransCookie = (targetLang: string) => {
    const hostname = window.location.hostname;
    const value = `/en/${targetLang}`;
    // Must be set on both bare hostname and dot-prefixed for subdomain support
    document.cookie = `googtrans=${value};path=/`;
    document.cookie = `googtrans=${value};path=/;domain=${hostname}`;
    document.cookie = `googtrans=${value};path=/;domain=.${hostname}`;
};

const clearGoogTransCookie = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

    document.cookie = `googtrans=;${expiry};path=/`;
    document.cookie = `googtrans=;${expiry};path=/;domain=${hostname}`;
    document.cookie = `googtrans=;${expiry};path=/;domain=.${hostname}`;

    // Nuke the cookie across all possible domain hierarchies
    let domain = "";
    for (let i = parts.length - 1; i >= 0; i--) {
        domain = "." + parts[i] + domain;
        document.cookie = `googtrans=;${expiry};path=/;domain=${domain}`;
        document.cookie = `googtrans=;${expiry};path=/;domain=${domain.substring(1)}`;
    }
};

// Wait for goog-te-combo to appear in the DOM (max ~5 s)
const waitForCombo = (timeout = 5000): Promise<HTMLSelectElement | null> =>
    new Promise((resolve) => {
        const existing = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (existing) return resolve(existing);

        const observer = new MutationObserver(() => {
            const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });

const GoogleTranslate: React.FC = () => {
    const [currentLang, setCurrentLang] = useState<string>("en");
    const [isOpen, setIsOpen] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    // Read cookie only on client-side mount
    useEffect(() => {
        setCurrentLang(getLangFromCookie());
    }, []);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const initDone = useRef(false);

    // Close dropdown on outside click
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // Inject Google Translate script exactly once
    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        if (!document.getElementById("google_translate_hidden_container")) {
            const div = document.createElement("div");
            div.id = "google_translate_hidden_container";
            // Visually hidden but NOT display:none — Google needs it renderable
            div.style.cssText =
                "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;";
            document.body.appendChild(div);
        }

        window.googleTranslateInit = () => {
            if (window.google?.translate?.TranslateElement) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,hi,mr,bho,or,gu",
                        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                        autoDisplay: false,
                    },
                    "google_translate_hidden_container"
                );
            }
        };

        if (!document.getElementById("google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src =
                "//translate.google.com/translate_a/element.js?cb=googleTranslateInit";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleLanguageChange = useCallback(async (selectedCode: string) => {
        if (selectedCode === currentLang || isChanging) return;

        setIsOpen(false);
        setIsChanging(true);

        try {
            if (selectedCode === "en") {
                clearGoogTransCookie();
                window.location.reload();
                return;
            }

            setGoogTransCookie(selectedCode);

            const combo = await waitForCombo();
            if (combo) {
                combo.value = selectedCode;
                combo.dispatchEvent(new Event("change", { bubbles: true }));
                setCurrentLang(selectedCode);
            } else {
                // Combo never appeared — fall back to cookie + reload
                window.location.reload();
            }
        } finally {
            setIsChanging(false);
        }
    }, [currentLang, isChanging]);

    useEffect(() => {
        waitForCombo(3000).then((combo) => {
            if (combo && combo.value && combo.value !== currentLang) {
                setCurrentLang(combo.value);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentLangName =
        LANGUAGES.find((l) => l.code === currentLang)?.name ?? "English";

    return (
        <div className="w-full sm:w-auto" ref={dropdownRef}>
            <button
                type="button"
                translate="no"
                onClick={() => !isChanging && setIsOpen(true)}
                disabled={isChanging}
                className="flex items-center justify-between gap-3 w-full bg-zinc-100 dark:bg-zinc-800/50 border border-transparent rounded-2xl px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all focus:outline-none group disabled:opacity-60"
            >
                <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Globe
                            className={cn(
                                "w-4 h-4 text-emerald-600 dark:text-emerald-500",
                                isChanging ? "animate-spin" : "group-hover:animate-pulse"
                            )}
                        />
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">Language</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-full text-left">
                            {isChanging ? "Translating…" : currentLangName}
                        </span>
                    </div>
                </div>
            </button>

            <BottomSheet
                open={isOpen && !isChanging}
                onOpenChange={setIsOpen}
                title="Select Language"
            >
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {LANGUAGES.map((lang) => {
                        const isActive = currentLang === lang.code;
                        return (
                            <button
                                key={lang.code}
                                translate="no"
                                onClick={() => handleLanguageChange(lang.code)}
                                className={cn(
                                    "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left",
                                    isActive
                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/20"
                                        : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md"
                                )}
                            >
                                <div className="flex justify-between items-center w-full mb-1">
                                    <span className={cn("text-lg font-bold", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-900 dark:text-white")}>
                                        {lang.name}
                                    </span>
                                    {isActive && <Check className="w-5 h-5 text-emerald-600" />}
                                </div>
                                <span className="text-xs font-semibold text-zinc-400">{lang.code.toUpperCase()}</span>
                            </button>
                        );
                    })}
                </div>
            </BottomSheet>

            <style dangerouslySetInnerHTML={{
                __html: `
                body { top: 0 !important; position: static !important; }
                .skiptranslate > iframe, .skiptranslate { display: none !important; }
                #goog-gt-tt { display: none !important; }
            `}}
            />
        </div>
    );
};

export default GoogleTranslate;