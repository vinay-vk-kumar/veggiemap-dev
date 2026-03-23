"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// --- Custom Icons ---
const storeIcon = new Icon({
    iconUrl: "https://img.icons8.com/fluency/96/stall.png", // Store/Shop Icon
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

// Component to handle map clicks
function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface StaticLocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onSave: (lat: number, lng: number) => Promise<void>;
    onCancel?: () => void;
    readOnly?: boolean;
}

// Component to handle dynamic map interaction states
function MapInteractionController({ readOnly }: { readOnly: boolean }) {
    const map = useMapEvents({});

    useEffect(() => {
        if (readOnly) {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if ((map as any).tap) (map as any).tap.disable();
        } else {
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            if ((map as any).tap) (map as any).tap.enable();
        }
    }, [map, readOnly]);

    return null;
}

export default function StaticLocationPicker({ initialLat, initialLng, onSave, onCancel, readOnly = false }: StaticLocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const [isSaving, setIsSaving] = useState(false);

    // If no initial position, try to get current location to center the map (UX only)
    const [center, setCenter] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );

    useEffect(() => {
        if (!center) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
                () => setCenter([28.6139, 77.2090]) // Default
            );
        }
    }, [center]);

    const handleSave = async () => {
        if (!position) return;
        setIsSaving(true);
        await onSave(position.lat, position.lng);
        setIsSaving(false);
    };

    if (!center) return <div className="h-[400px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl">Loading Map...</div>;

    return (
        <div className="space-y-4">
            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative z-0 shadow-sm">
                <MapContainer
                    center={center}
                    zoom={15}
                    className="h-full w-full"
                    dragging={!readOnly} // Initial state
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapInteractionController readOnly={readOnly} />

                    {!readOnly && <LocationSelector onLocationSelect={(lat, lng) => setPosition({ lat, lng })} />}

                    {position && (
                        <Marker position={[position.lat, position.lng]} icon={storeIcon}>
                            <Popup>Your Shop Location</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {!readOnly && (
                <div className="flex items-center justify-between gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Click on the map to place your pin.</p>
                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSaving}
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={!position || isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Location
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
