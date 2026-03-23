"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Bug, Trash2, RefreshCw, LogOut, X, ChevronRight,
    Loader2, ImageIcon, AlertTriangle
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
// Backend base for serving images — in prod same domain proxied by Nginx
const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || "secret-admin-a7f3k2";

const STATUS_CYCLE = ["open", "in-review", "resolved"] as const;
type BugStatus = typeof STATUS_CYCLE[number];

const STATUS_CONFIG: Record<BugStatus, { label: string; className: string }> = {
    "open":      { label: "Open",      className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800/60" },
    "in-review": { label: "In Review", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60" },
    "resolved":  { label: "Resolved",  className: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-800/60" },
};

interface BugReport {
    _id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    reportedBy: { userId: string; email: string; role: "vendor" | "consumer" };
    status: BugStatus;
    createdAt: string;
}

export default function AdminBugsPage() {
    const router = useRouter();
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const getAdminToken = () =>
        typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    const authHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
    });

    const fetchBugs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/bugs`, { headers: authHeaders() });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("adminToken");
                router.replace(`/${ADMIN_PATH}`);
                return;
            }
            if (!res.ok) throw new Error("Failed to load bug reports.");
            const data = await res.json();
            setBugs(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const token = getAdminToken();
        if (!token) { router.replace(`/${ADMIN_PATH}`); return; }
        fetchBugs();
    }, [fetchBugs, router]);

    const handleToggleStatus = async (id: string) => {
        setTogglingId(id);
        try {
            const res = await fetch(`${API_BASE}/bugs/${id}/status`, {
                method: "PATCH",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error("Failed to update status.");
            const { bug } = await res.json();
            setBugs((prev) => prev.map((b) => (b._id === id ? { ...b, status: bug.status } : b)));
        } catch {
            // silently fail — they can refresh
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE}/bugs/${id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error("Failed to delete.");
            setBugs((prev) => prev.filter((b) => b._id !== id));
        } catch {
            // silently fail
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        router.replace(`/${ADMIN_PATH}`);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 md:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                        <Bug className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold leading-tight">Bug Reports</h1>
                        <p className="text-xs text-zinc-500">{bugs.length} report{bugs.length !== 1 ? "s" : ""} total</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBugs}
                        className="p-2 rounded-xl hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* ── Content ──────────────────────────────────────────────── */}
            <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm">Loading bug reports…</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-sm text-red-400">{error}</p>
                        <button onClick={fetchBugs} className="px-4 py-2 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700 transition">
                            Try Again
                        </button>
                    </div>
                )}

                {!isLoading && !error && bugs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-600">
                        <Bug className="w-12 h-12" />
                        <p className="font-semibold">No bug reports yet</p>
                        <p className="text-sm">Reports will appear here once users submit them.</p>
                    </div>
                )}

                {!isLoading && !error && bugs.length > 0 && (
                    <div className="space-y-4">
                        {bugs.map((bug) => {
                            const statusCfg = STATUS_CONFIG[bug.status];
                            return (
                                <div key={bug._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
                                    <div className="p-5 md:p-6">
                                        {/* Top row */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-base font-bold text-white truncate mb-1">{bug.title}</h2>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${bug.reportedBy.role === "vendor" ? "bg-blue-950/50 text-blue-400" : "bg-purple-950/50 text-purple-400"}`}>
                                                        {bug.reportedBy.role}
                                                    </span>
                                                    <span className="truncate">{bug.reportedBy.email}</span>
                                                    <span>·</span>
                                                    <span>{formatDate(bug.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Status badge */}
                                            <button
                                                onClick={() => handleToggleStatus(bug._id)}
                                                disabled={togglingId === bug._id}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-70 ${statusCfg.className}`}
                                                title="Click to cycle status"
                                            >
                                                {togglingId === bug._id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3" />
                                                )}
                                                {statusCfg.label}
                                            </button>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                                            {bug.description}
                                        </p>

                                        {/* Image + Delete row */}
                                        <div className="flex items-center justify-between gap-3">
                                            {bug.imageUrl ? (
                                                <button
                                                    onClick={() => setLightboxImg(`${BACKEND_BASE}${bug.imageUrl}`)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition"
                                                >
                                                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                                                    View Screenshot
                                                </button>
                                            ) : (
                                                <span className="text-xs text-zinc-600 italic">No screenshot</span>
                                            )}

                                            {/* Delete */}
                                            {confirmDeleteId === bug._id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-400">Delete?</span>
                                                    <button
                                                        onClick={() => handleDelete(bug._id)}
                                                        disabled={deletingId === bug._id}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition flex items-center gap-1"
                                                    >
                                                        {deletingId === bug._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-xs font-medium transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(bug._id)}
                                                    className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition"
                                                    title="Delete report"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Lightbox ─────────────────────────────────────────────── */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImg(null)}
                >
                    <button
                        onClick={() => setLightboxImg(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxImg}
                        alt="Bug screenshot"
                        className="max-w-full max-h-[90vh] rounded-xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
