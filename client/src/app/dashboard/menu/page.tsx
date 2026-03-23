"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, PackageOpen, Loader2, Sparkles, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import MenuImage from "@/components/ui/MenuImage";

interface MenuItem {
    _id: string;
    productName: string;
    pricePerKg: number;
    itemStatus: "in-stock" | "out-of-stock";
    image?: string;
    category?: "vegetable" | "fruit" | "other";
}

export default function MenuPage() {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Simplification: We remove confirm delete dialog for faster operations or use a simpler one.
    // Let's keep a fast native confirm for low-fi, high-speed usage.

    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formCategory, setFormCategory] = useState<"vegetable" | "fruit" | "other">("vegetable");
    const [formImage, setFormImage] = useState("");
    const [isAutoGeneratingImage, setIsAutoGeneratingImage] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const response = await api.get("/vendor/menu");
            setMenu(response.data);
        } catch (error) {
            console.error("Failed to fetch menu:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAutoGeneratingImage(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const serverOrigin = (api.defaults.baseURL || "http://localhost:5000/api")
                .replace(/\/api\/?$/, "");
            setFormImage(`${serverOrigin}${response.data.filePath}`);
            toast.success("Image uploaded!");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload image");
        } finally {
            setIsAutoGeneratingImage(false);
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formPrice) return;

        setIsSaving(true);
        try {
            const payload = {
                productName: formName,
                pricePerKg: parseFloat(formPrice),
                itemStatus: editingItem ? editingItem.itemStatus : "in-stock",
                image: formImage,
                category: formCategory
            };

            if (editingItem) {
                const response = await api.patch(`/vendor/menu/${editingItem._id}`, payload);
                setMenu(menu.map(item => item._id === editingItem._id ? response.data : item));
                toast.success("Item updated!");
            } else {
                const response = await api.post("/vendor/menu", payload);
                setMenu([...menu, response.data]);
                toast.success("Item added to menu!");
            }
            closeDialog();
        } catch (error) {
            console.error("Failed to save item:", error);
            toast.error("Error saving item");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async (item: MenuItem) => {
        if (!window.confirm(`Delete ${item.productName}?`)) return;

        const oldMenu = menu;
        setMenu(menu.filter(m => m._id !== item._id));

        try {
            await api.delete(`/vendor/menu/${item._id}`);
            toast.success("Deleted successfully");
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Failed to delete item");
            setMenu(oldMenu);
        }
    };

    const openAddDialog = () => {
        setEditingItem(null);
        setFormName("");
        setFormPrice("");
        setFormCategory("vegetable");
        setFormImage("");
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: MenuItem) => {
        setEditingItem(item);
        setFormName(item.productName);
        setFormPrice(item.pricePerKg.toString());
        setFormCategory(item.category || "vegetable");
        setFormImage(item.image || "");
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const toggleStatus = async (item: MenuItem, newStatus: "in-stock" | "out-of-stock") => {
        if (item.itemStatus === newStatus) return; // already in this state

        setMenu(menu.map(m => m._id === item._id ? { ...m, itemStatus: newStatus } : m));
        try {
            await api.patch(`/vendor/menu/${item._id}`, { itemStatus: newStatus });
        } catch (error) {
            console.error("Failed to toggle status", error);
            setMenu(menu.map(m => m._id === item._id ? item : m)); // revert
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 pb-24 md:pb-0 font-sans">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Manage Menu</h2>
                    <p className="text-base text-zinc-500 font-medium">Add items and update stock.</p>
                </div>
            </div>

            {/* Mobile Fixed Add Button (Massive FAB) */}
            <Button
                onClick={openAddDialog}
                className="md:hidden fixed bottom-24 right-5 w-16 h-16 rounded-[24px] bg-green-600 hover:bg-green-700 text-white shadow-[0_10px_25px_rgba(22,163,74,0.4)] z-40 flex items-center justify-center p-0 transition-transform active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </Button>

            {/* Desktop Add Button */}
            <Button onClick={openAddDialog} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white gap-2 font-bold py-6 px-6 rounded-2xl shadow-lg shadow-green-600/20 text-lg w-full max-w-sm mb-8">
                <Plus className="w-6 h-6" /> Add New Product
            </Button>

            {/* Add/Edit Dialog using Vaul for Mobile or Dialog for Desktop */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl w-[96vw] rounded-[32px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <DialogTitle className="text-2xl font-extrabold text-zinc-900 dark:text-white">{editingItem ? "Edit Product" : "New Product"}</DialogTitle>
                        <DialogDescription className="font-medium text-zinc-500">
                            Fill details to display on your shop menu.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveItem} className="p-6 space-y-8">
                        {/* Huge Image Upload */}
                        <div className="flex justify-center">
                            <div className="relative w-40 h-40 rounded-[32px] overflow-hidden border-4 border-dashed border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col items-center justify-center group shrink-0 shadow-sm cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
                                <MenuImage
                                    src={formImage}
                                    alt="Preview"
                                    category={formCategory}
                                    previewMode={true}
                                />
                                {isAutoGeneratingImage && (
                                    <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                    </div>
                                )}
                                <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 hover:bg-black/10 transition-opacity z-20">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    <Sparkles className="w-8 h-8 text-green-600 drop-shadow-md mb-2" />
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full shadow-sm border border-green-200">Tap to Change</span>
                                </label>
                            </div>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                            <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {([
                                        { value: "vegetable", label: "Vegetable", emoji: "🥦" },
                                        { value: "fruit",     label: "Fruit",     emoji: "🍎" },
                                        { value: "other",     label: "Other",     emoji: "📦" },
                                    ] as const).map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setFormCategory(cat.value)}
                                            className={cn(
                                                "flex-1 min-w-[80px] h-12 rounded-2xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-1.5",
                                                formCategory === cat.value
                                                    ? "border-green-500 bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400"
                                                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                                            )}
                                        >
                                            <span>{cat.emoji}</span> {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Product Name</Label>
                                <Input
                                    placeholder="e.g. Fresh Tomatoes"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                    className="h-14 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-semibold text-lg rounded-2xl px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Price per Kg (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 text-green-600 font-bold text-lg leading-none">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formPrice}
                                        onChange={(e) => setFormPrice(e.target.value)}
                                        required
                                        min="1"
                                        className="h-14 pl-10 pr-24 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold text-xl rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    />
                                    <div className="absolute right-3 top-2.5 h-9 px-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400 text-sm">per Kg</div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold h-16 text-lg rounded-[20px] shadow-xl shadow-green-600/20 transition-all"
                        >
                            {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : (editingItem ? "Update Item" : "Add to Shop")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Menu List */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                </div>
            ) : menu.length === 0 ? (
                <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-950 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageOpen className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Shop is Empty</h3>
                    <p className="text-zinc-500 font-medium">Tap the + button to add products.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-2 pb-6">
                    {menu.map((item) => (
                        <div key={item._id} className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 shrink-0 rounded-[32px] shadow-sm flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-[88px] h-[88px] rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex-shrink-0 overflow-hidden relative">
                                    <MenuImage src={item.image} alt={item.productName} category={item.category} />
                                    {item.itemStatus === 'out-of-stock' && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black px-2 py-1 rounded-full shadow-md">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <h3 className="font-bold text-xl text-zinc-900 dark:text-white truncate mb-1 leading-tight">{item.productName}</h3>
                                    <div className="font-extrabold text-green-600 dark:text-green-500 text-2xl tracking-tight leading-none mb-1">
                                        ₹{item.pricePerKg} <span className="text-[13px] text-zinc-400 tracking-normal font-semibold">/kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Row - Massive Split Buttons for Stock Control */}
                            <div className="flex gap-2 w-full pt-1 border-t border-zinc-100 dark:border-zinc-900/50">
                                <Button
                                    onClick={() => toggleStatus(item, "in-stock")}
                                    variant={item.itemStatus === 'in-stock' ? "default" : "outline"}
                                    className={cn(
                                        "flex-1 h-12 rounded-xl text-sm font-bold shadow-none",
                                        item.itemStatus === 'in-stock' ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none dark:bg-emerald-500/20 dark:text-emerald-400" : "text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-transparent"
                                    )}
                                >
                                    In Stock
                                </Button>
                                <Button
                                    onClick={() => toggleStatus(item, "out-of-stock")}
                                    variant={item.itemStatus === 'out-of-stock' ? "default" : "outline"}
                                    className={cn(
                                        "flex-1 h-12 rounded-xl text-sm font-bold shadow-none",
                                        item.itemStatus === 'out-of-stock' ? "bg-red-100 text-red-800 hover:bg-red-200 border-none dark:bg-red-500/20 dark:text-red-400" : "text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-transparent"
                                    )}
                                >
                                    Sold Out
                                </Button>
                                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => openEditDialog(item)}>
                                    <Edit2 className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 dark:hover:bg-red-950/30" onClick={() => confirmDelete(item)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
