"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Button } from "@/components/ui/button";

// --- Custom Icon for the Vendor ---
// --- Custom Icons ---
const cartIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3721/3721619.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

const storeIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1055/1055646.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

// Helper to Recenter Map when position updates
function Recenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
}

interface VendorPreviewMapProps {
    lat: number | null;
    lng: number | null;
    isStatic?: boolean;
}

export default function VendorPreviewMap({ lat, lng, isStatic }: VendorPreviewMapProps) {
    // Default to New Delhi if no location yet
    const center: [number, number] = lat && lng ? [lat, lng] : [28.6139, 77.2090];
    const activeIcon = isStatic ? storeIcon : cartIcon;

    return (
        <MapContainer
            center={center}
            zoom={16}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
            zoomControl={false} // Cleaner look for a preview card
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {lat && lng && (
                <>
                    <Marker position={[lat, lng]} icon={activeIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-semibold text-xs">{isStatic ? "Your Shop" : "You are here"}</p>
                                <p className="text-[10px] text-green-600">{isStatic ? "Shown on user map" : "Broadcasting..."}</p>
                            </div>
                        </Popup>
                    </Marker>
                    <Recenter lat={lat} lng={lng} />
                </>
            )}
        </MapContainer>
    );
}
