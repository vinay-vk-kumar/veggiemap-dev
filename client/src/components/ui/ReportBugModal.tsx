"use client";

import { useState, useRef } from "react";
import { Bug, X, Upload, Loader2, ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function ReportBugModal({ open, onClose }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setTitle("");
        setDescription("");
        setImage(null);
        setPreview(null);
        setSubmitted(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            toast.error("Title and description are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            if (image) formData.append("image", image);

            const res = await fetch(`${API_BASE}/bugs`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to submit.");
            }

            setSubmitted(true);
            toast.success("Bug report submitted! Thank you.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Sheet on mobile, modal on desktop */}
            <div className={cn(
                "relative z-10 w-full sm:max-w-lg bg-white dark:bg-zinc-950 shadow-2xl flex flex-col",
                "rounded-t-[28px] sm:rounded-[24px]",
                "max-h-[90dvh] sm:max-h-[85vh]"
            )}>
                {/* Drag handle (mobile only) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-xl">
                            <Bug className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Report a Bug</h2>
                            <p className="text-xs text-zinc-500 font-medium">Help us improve VeggieMap</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-full">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Thank you!</h3>
                                <p className="text-sm text-zinc-500 mt-1">Your bug report has been received. We'll look into it soon.</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="mt-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Bug Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Map doesn't load on Safari"
                                    maxLength={150}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Full Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what happened, what you expected, and the steps to reproduce the issue..."
                                    rows={5}
                                    maxLength={5000}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition resize-none"
                                />
                                <p className="text-xs text-zinc-400 mt-1 text-right">{description.length}/5000</p>
                            </div>

                            {/* Screenshot Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Screenshot <span className="text-zinc-400 font-normal">(optional)</span>
                                </label>

                                {preview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-28 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors text-zinc-400 hover:text-green-600"
                                    >
                                        <ImageIcon className="w-6 h-6" />
                                        <span className="text-sm font-medium">Click to upload screenshot</span>
                                        <span className="text-xs">PNG, JPG up to 5MB</span>
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !title.trim() || !description.trim()}
                                className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Submit Bug Report</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
