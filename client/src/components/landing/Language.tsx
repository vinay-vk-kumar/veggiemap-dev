import React, { useEffect, useState, useRef, useCallback } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `googtrans=;${expiry};path=/`;
    document.cookie = `googtrans=;${expiry};path=/;domain=${hostname}`;
    document.cookie = `googtrans=;${expiry};path=/;domain=.${hostname}`;
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
    // Initialise with "en" so SSR perfectly matches initial hydration.
    // Update it in useEffect to the cookie value to avoid React Hydration Error #418.
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
                // Use Google's own restore function if available, otherwise reload
                const restoreFn =
                    (window as any).google?.translate?.TranslateElement?.getInstance?.()
                        ?.restore;
                if (typeof restoreFn === "function") {
                    restoreFn();
                    setCurrentLang("en");
                } else {
                    window.location.reload();
                }
                return;
            }

            // Set cookie first so if combo isn't ready, a reload would still apply it
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

    // One-time sync on mount: if Google already translated the page (e.g. back-navigation),
    // make sure our UI reflects that without a polling loop
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
        <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
            <button
                type="button"
                translate="no"
                onClick={() => !isChanging && setIsOpen((o) => !o)}
                disabled={isChanging}
                className="flex items-center justify-between gap-3 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 sm:py-2.5 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 group disabled:opacity-60 disabled:cursor-wait"
            >
                <div className="flex items-center gap-2">
                    <Globe
                        className={cn(
                            "w-5 h-5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-500",
                            isChanging ? "animate-spin" : "group-hover:animate-pulse"
                        )}
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {isChanging ? "Translating…" : currentLangName}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-zinc-400 transition-transform duration-300",
                        isOpen ? "rotate-180" : ""
                    )}
                />
            </button>

            {isOpen && !isChanging && (
                <div className="absolute top-full left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {LANGUAGES.map((lang) => {
                            const isActive = currentLang === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    translate="no"
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={cn(
                                        "flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {lang.name}
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

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