"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, PackageOpen, Loader2, Save, X, Search, Sparkles, Upload, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

    // Form State for Add/Edit
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null); // If null, we are adding
    //const [editingItem, setEditingItem] = useState<MenuItem | null>(null); // If null, we are adding
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Delete Confirmation State
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

        setIsAutoGeneratingImage(true); // Reuse this loader state
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // Backend returns relative path "/uploads/filename.jpg"
            // We need to prepend the backend URL if not handled by proxy/base URL
            // Assuming api.defaults.baseURL handles the domain, but here the image URL needs to be full or handled by an image component.
            // Let's store the full URL or relative path? 
            // If we store "/uploads/...", an <img src="/uploads/..." /> works if Served from same origin or proxy.
            // But api is likely on port 5000 and client on 3000.
            // So we need the backend URL.
            const backendUrl = "http://localhost:5000";
            setFormImage(`${backendUrl}${response.data.filePath}`);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image");
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
                // Update existing
                const response = await api.patch(`/vendor/menu/${editingItem._id}`, payload);
                setMenu(menu.map(item => item._id === editingItem._id ? response.data : item));
            } else {
                // Create new
                const response = await api.post("/vendor/menu", payload);
                setMenu([...menu, response.data]);
            }

            closeDialog();
        } catch (error) {
            console.error("Failed to save item:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteConfirm = (item: MenuItem) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const oldMenu = menu;
        setMenu(menu.filter(item => item._id !== itemToDelete._id));
        setIsDeleteDialogOpen(false);

        try {
            await api.delete(`/vendor/menu/${itemToDelete._id}`);
            toast.success("Item deleted successfully");
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Failed to delete item");
            setMenu(oldMenu);
        } finally {
            setItemToDelete(null);
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

    const toggleStatus = async (item: MenuItem) => {
        const newStatus = item.itemStatus === "in-stock" ? "out-of-stock" : "in-stock";

        // Optimistic
        setMenu(menu.map(m => m._id === item._id ? { ...m, itemStatus: newStatus } : m));

        try {
            await api.patch(`/vendor/menu/${item._id}`, { itemStatus: newStatus });
        } catch (error) {
            console.error("Failed to toggle status", error);
            // Revert
            setMenu(menu.map(m => m._id === item._id ? item : m));
        }
    };

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">My Menu</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your inventory</p>
                </div>

                {/* Desktop Add Button */}
                <Button onClick={openAddDialog} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                </Button>
            </div>

            {/* Mobile Fixed Add Button (FAB) */}
            <Button
                onClick={openAddDialog}
                className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg z-40 flex items-center justify-center p-0"
            >
                <Plus className="w-6 h-6" />
            </Button>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl w-[95vw] rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold">{editingItem ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                            Add a new item to your shop's menu.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveItem}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                            {/* Left Column: Image & AI (40%) */}
                            <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-800/50 p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold">
                                        <Sparkles className="w-4 h-4 text-green-600" /> Product Image
                                    </Label>
                                </div>

                                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 flex items-center justify-center shadow-sm group">
                                    <MenuImage
                                        src={formImage}
                                        alt="Preview"
                                        category={formCategory}
                                        previewMode={true}
                                    />

                                    {isAutoGeneratingImage && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 flex flex-col items-center justify-center gap-2 backdrop-blur-sm z-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                            <span className="text-xs font-medium text-green-600">Uploading...</span>
                                        </div>
                                    )}

                                    {/* Hidden File Input */}
                                    <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center opacity-0 hover:opacity-100 hover:bg-black/5 transition-opacity z-20">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-center text-zinc-400">Tap to upload image</p>
                            </div>

                            {/* Right Column: Form Details (60%) */}
                            <div className="md:col-span-3 p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Category</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: "vegetable", icon: "🥦", label: "Veg" },
                                                { id: "fruit", icon: "🍎", label: "Fruit" },
                                                { id: "other", icon: "📦", label: "Other" }
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormCategory(cat.id as any)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200",
                                                        formCategory === cat.id
                                                            ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400 ring-1 ring-green-600/20"
                                                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                                    )}
                                                >
                                                    <span className="text-xl filter drop-shadow-sm">{cat.icon}</span>
                                                    <span className="text-xs font-medium">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Details</Label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Input
                                                    placeholder="Product Name"
                                                    value={formName}
                                                    onChange={(e) => setFormName(e.target.value)}
                                                    required
                                                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 font-medium"
                                                />
                                                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-zinc-400 font-medium">₹</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Price"
                                                        value={formPrice}
                                                        onChange={(e) => setFormPrice(e.target.value)}
                                                        required
                                                        min="1"
                                                        className="pl-7 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-500">
                                                    per Kg
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 shadow-sm"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        {editingItem ? "Save Changes" : "Add to Menu"}
                                    </Button>


                                </div>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">Delete Item?</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">"{itemToDelete?.productName}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="dark:text-white dark:hover:bg-zinc-800">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                </div>
            ) : menu.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                        <PackageOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Your menu is empty</h3>
                    <p className="text-zinc-500 mb-6 max-w-sm mx-auto">Add items to start selling.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {menu.map((item) => (
                        <div key={item._id} className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center gap-3 shadow-sm overflow-hidden active:scale-[0.99] transition-transform touch-none">
                            {/* Image */}
                            <div className="w-20 h-20 rounded-lg bg-zinc-50 border border-zinc-100 flex-shrink-0 overflow-hidden relative">
                                <MenuImage
                                    src={item.image}
                                    alt={item.productName}
                                    category={item.category}
                                />
                                {item.itemStatus === 'out-of-stock' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-zinc-900 dark:text-white text-base truncate">{item.productName}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-green-600 font-bold text-lg">₹{item.pricePerKg}</span>
                                    <span className="text-xs text-zinc-400">/ kg</span>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex flex-col gap-2">
                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-zinc-200 bg-zinc-50" onClick={() => openEditDialog(item)}>
                                    <Edit2 className="w-3.5 h-3.5 text-zinc-600" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant={item.itemStatus === 'in-stock' ? "default" : "secondary"}
                                    className={cn(
                                        "h-8 w-8 rounded-full",
                                        item.itemStatus === 'in-stock' ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" : "bg-zinc-100 text-zinc-400"
                                    )}
                                    onClick={() => toggleStatus(item)}
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => openDeleteConfirm(item)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
