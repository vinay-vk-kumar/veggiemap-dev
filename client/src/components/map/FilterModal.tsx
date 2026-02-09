import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { X, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FilterModalProps {
    onApply: (filters: { sortBy: string; maxDistance: number; category: string }) => void;
    currentFilters: { sortBy: string; maxDistance: number; category: string };
}

export function FilterModal({ onApply, currentFilters }: FilterModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [sortBy, setSortBy] = useState(currentFilters.sortBy);
    const [maxDistance, setMaxDistance] = useState(currentFilters.maxDistance);
    const [category, setCategory] = useState(currentFilters.category);

    const handleApply = () => {
        onApply({ sortBy, maxDistance, category });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SlidersHorizontal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Filter & Sort</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Sort By */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Sort By</Label>
                        <RadioGroup value={sortBy} onValueChange={setSortBy} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="distance" id="sort-distance" className="peer sr-only" />
                                <Label
                                    htmlFor="sort-distance"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-zinc-100 bg-white p-4 hover:bg-zinc-50 hover:text-zinc-900 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:text-green-600 [&:has([data-state=checked])]:border-green-500"
                                >
                                    <span className="text-sm font-medium">Nearest</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="price" id="sort-price" className="peer sr-only" />
                                <Label
                                    htmlFor="sort-price"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-zinc-100 bg-white p-4 hover:bg-zinc-50 hover:text-zinc-900 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:text-green-600 [&:has([data-state=checked])]:border-green-500"
                                >
                                    <span className="text-sm font-medium">Lowest Price</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Category */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Category</Label>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'vegetable', 'fruit', 'other'].map((cat) => (
                                <Button
                                    key={cat}
                                    variant={category === cat ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setCategory(cat)}
                                    className={category === cat ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Distance Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Max Distance</Label>
                            <span className="text-sm text-zinc-500">{(maxDistance / 1000).toFixed(1)} km</span>
                        </div>
                        <Slider
                            value={[maxDistance]}
                            onValueChange={(vals) => setMaxDistance(vals[0])}
                            max={20000} // 20km
                            step={100}
                            className="[&_.range-thumb]:bg-green-600 [&_.range-track]:bg-green-200"
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => {
                        setSortBy('distance');
                        setMaxDistance(5000);
                        setCategory('all');
                        onApply({ sortBy: 'distance', maxDistance: 5000, category: 'all' });
                        setIsOpen(false);
                    }} className="w-full sm:w-auto">
                        Reset Filters
                    </Button>
                    <Button onClick={handleApply} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                        Apply Filters
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
