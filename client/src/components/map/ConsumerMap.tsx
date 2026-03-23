"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "@/context/SocketContext";
import { Icon, divIcon } from "leaflet";
import { Loader2, Navigation, Search, Filter, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import VendorCard from "../consumer/VendorCard";
import { FilterModal } from "./FilterModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// --- Custom Icons ---
const getRotatedVendorIcon = (bearing = 0) => {
    return divIcon({
        className: 'bg-transparent border-0',
        html: `<div style="transform: rotate(${bearing}deg); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease;">
                 <img src="https://cdn-icons-png.flaticon.com/512/3721/3721619.png" style="width: 100%; height: 100%; object-fit: contain;" />
               </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19], // Centered for rotation
        popupAnchor: [0, -19]
    });
};

const storeIconSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;

const getStoreIcon = (isOnline: boolean) => {
    const color = isOnline ? '#10b981' : '#f43f5e'; // Emerald vs Rose
    return divIcon({
        className: 'bg-transparent border-0',
        html: `<div style="position: relative; width: 44px; height: 50px; display: flex; align-items: flex-end; justify-content: center; filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.2)); transition: transform 0.2s;">
                 <div style="background-color: ${color}; width: 38px; height: 38px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; z-index: 2; position: absolute; top: 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    ${storeIconSVG}
                 </div>
                 <div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 18px solid ${color}; position: absolute; bottom: 2px; z-index: 1;"></div>
               </div>`,
        iconSize: [44, 50],
        iconAnchor: [22, 50],
        popupAnchor: [0, -50]
    });
};

const myLocationIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png", // Blue dot
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Helper component to handle map clicks/movement
function MapEvents({ onMapClick, onMoveEnd }: { onMapClick: () => void, onMoveEnd: (center: [number, number]) => void }) {
    const map = useMap();
    useMapEvents({
        click: () => onMapClick(),
        moveend: () => {
            const newCenter = map.getCenter();
            onMoveEnd([newCenter.lat, newCenter.lng]);
        }
    });
    return null;
}

// Helper to re-center map
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15);
    }, [center, map]);
    return null;
}

interface VendorMarker {
    _id: string;
    userId: string;
    lat: number;
    lng: number;
    vendorName: string;
    shopName?: string;
    shopImage?: string;
    isStatic?: boolean;
    vendorType: "static" | "mobile";
    menu: any[];
    isOnline: boolean;
    distance?: number;
    phoneNumber?: string;
    lastSeen?: number; // timestamp
    bearing?: number; // 0-360 degrees
}

interface SearchTag {
    _id: string;
    vendorId: string;
    type: 'shop' | 'item';
    displayText: string;
    image?: string;
    price?: number;
    subText?: string;
    distance?: number;
    isOnline: boolean;
    location: { coordinates: [number, number] };
}

export default function ConsumerMap() {
    const { socket } = useSocket();
    const { user } = useAuth();

    // State
    const [center, setCenter] = useState<[number, number] | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
    const [vendors, setVendors] = useState<Record<string, VendorMarker>>({});
    const [selectedVendor, setSelectedVendor] = useState<VendorMarker | null>(null);

    // Search V2 State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchTag[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [favorites, setFavorites] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        sortBy: 'distance',
        maxDistance: 5000,
        category: 'all'
    });

    const [shouldRecenter, setShouldRecenter] = useState(true);
    const isProgrammaticMove = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    // 1. Get User Location & Favorites
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
                    setCenter(loc);
                    setUserLocation(loc);
                    setSearchCenter(loc);
                },
                (error) => {
                    console.error("Location error", error);
                    const defaultLoc: [number, number] = [28.6139, 77.2090];
                    setCenter(defaultLoc);
                    setUserLocation(defaultLoc);
                    setSearchCenter(defaultLoc);
                }
            );
        } else {
            const defaultLoc: [number, number] = [28.6139, 77.2090];
            setCenter(defaultLoc);
            setUserLocation(defaultLoc);
            setSearchCenter(defaultLoc);
        }

        if (user) fetchFavorites();
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/consumer/favorites');
            const favIds = res.data.map((v: any) => v._id);
            setFavorites(favIds);
        } catch (error) {
            console.error("Failed to load favorites", error);
        }
    };

    const toggleFavorite = async (vendorId: string) => {
        try {
            const res = await api.post(`/consumer/favorites/${vendorId}`);
            if (res.data.status === 'added') {
                setFavorites(prev => [...prev, vendorId]);
            } else {
                setFavorites(prev => prev.filter(id => id !== vendorId));
            }
        } catch (error) {
            console.error("Failed to update favorite");
        }
    };




    // --- Socket Logic Split ---

    // A. Socket Event Listeners (Run once on mount/socket change)
    useEffect(() => {
        if (!socket) return;

        const handleLocationMove = (data: any) => {
            const { vendorId, location } = data;
            setVendors(prev => {
                const existing = prev[vendorId] || {};
                
                // Calculate bearing for movement direction
                let newBearing = existing.bearing || 0;
                if (existing.lat && existing.lng && (existing.lat !== location.lat || existing.lng !== location.lng)) {
                   const dy = location.lat - existing.lat;
                   const dx = Math.cos(Math.PI / 180 * existing.lat) * (location.lng - existing.lng);
                   newBearing = Math.atan2(dx, dy) * 180 / Math.PI;
                }

                return {
                    ...prev,
                    [vendorId]: {
                        ...existing,
                        _id: vendorId,
                        lat: location.lat,
                        lng: location.lng,
                        isStatic: false,
                        vendorType: 'mobile',
                        isOnline: true,
                        vendorName: existing.vendorName || "Active Vendor",
                        lastSeen: Date.now(),
                        bearing: newBearing
                    } as VendorMarker
                };
            });
        };

        const handleVendorRemoved = (data: { vendorId: string }) => {
            setVendors(prev => {
                const next = { ...prev };
                delete next[data.vendorId];
                return next;
            });
        };

        const handleStatusUpdate = (data: { vendorId: string, isOnline: boolean }) => {
            setVendors(prev => {
                if (!prev[data.vendorId]) return prev;
                return {
                    ...prev,
                    [data.vendorId]: {
                        ...prev[data.vendorId],
                        isOnline: data.isOnline
                    }
                };
            });
        };

        socket.on("vendor:location-move", handleLocationMove);
        socket.on("vendor:removed", handleVendorRemoved);
        socket.on("vendor:status-update", handleStatusUpdate);

        return () => {
            socket.off("vendor:location-move", handleLocationMove);
            socket.off("vendor:removed", handleVendorRemoved);
            socket.off("vendor:status-update", handleStatusUpdate);
        };
    }, [socket]);


    // B. Room Joining Logic (Runs when searchCenter changes)
    useEffect(() => {
        if (!searchCenter || !socket) return;
        const [lat, lng] = searchCenter;

        // Calculate Room ID (approximate grid)
        const newRoom = `geo-${Math.floor(lat)}-${Math.floor(lng)}`;

        // Only join if room has changed
        if (newRoom !== currentRoomRef.current) {
            // console.log(`Joining Room: ${newRoom} (Left: ${currentRoomRef.current})`);

            socket.emit("consumer:join-room", {
                lat, lng, previousRoom: currentRoomRef.current
            });

            currentRoomRef.current = newRoom;
        }
    }, [searchCenter, socket]);


    const handleResultClick = async (tag: SearchTag) => {
        isProgrammaticMove.current = true;
        setShouldRecenter(false);
        setSearchQuery(""); // Clear search on selection? Or keep it? Google clears or keeps text but hides list.
        setSearchResults([]); // Hide list

        // Centers map
        setCenter([tag.location.coordinates[1], tag.location.coordinates[0]]);

        // Select Vendor
        // 1. Check if we already have it in state
        const existingVendor = vendors[tag.vendorId];
        if (existingVendor) {
            setSelectedVendor(existingVendor);
        } else {
            // 2. Fetch full vendor details if not in view
            try {
                const res = await api.get(`/consumer/vendor/${tag.vendorId}`);
                if (res.data) {
                    // The instruction implies adding a call to /consumer/search here,
                    // but the context is fetching a specific vendor.
                    // Assuming 'params' would be derived from the current search state if this were a search trigger.
                    // For now, adding a placeholder for params if this call is indeed intended here.
                    // If this is meant to be part of the initial search query, it should be in a different useEffect or function.
                    const params = {
                        query: searchQuery,
                        lat: searchCenter ? searchCenter[0] : userLocation?.[0],
                        lng: searchCenter ? searchCenter[1] : userLocation?.[1],
                        maxDistance: filters.maxDistance,
                        category: filters.category,
                        sortBy: filters.sortBy
                    };
                    console.log("Fetching vendors with params:", params);
                    const response = await api.get('/consumer/search', { params });
                    console.log("[ConsumerMap] loadVendors response (Initial):", response.data, "Status:", response.status);

                    const loaded: Record<string, VendorMarker> = {};
                    const v = res.data;
                    const loadedVendor: VendorMarker = {
                        ...v,
                        lat: v.location.coordinates[1],
                        lng: v.location.coordinates[0],
                        isStatic: v.vendorType === 'static',
                    };
                    setSelectedVendor(loadedVendor);
                }
            } catch (error) {
                console.error("Failed to fetch vendor details", error);
            }
        }
    };



    if (!center) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="relative h-full w-full">
            {/* Search Bar & Filter */}
            <div className="absolute top-4 left-4 right-4 z-[400] max-w-md mx-auto pointer-events-none flex flex-col gap-2">
                <div className="flex gap-2 w-full pointer-events-auto">
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="bg-white dark:bg-zinc-900 rounded-full shadow-lg p-1.5 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 flex-1"
                    >
                        <Search className="w-5 h-5 ml-3 text-zinc-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search onion, tomatoes, or shop..."
                            className="border-none shadow-none focus-visible:ring-0 bg-transparent h-10 flex-1"
                        />
                        {searchQuery && (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-zinc-100"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                            >
                                <X className="w-4 h-4 text-zinc-500" />
                            </Button>
                        )}
                        <Button type="button" size="icon" className="rounded-full w-9 h-9 bg-green-600 hover:bg-green-700">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Navigation className="w-4 h-4 text-white" />}
                        </Button>
                    </form>
                    <FilterModal currentFilters={filters} onApply={setFilters} />
                </div>

                {/* Typeahead Results (Search V2) */}
                {searchResults.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 pointer-events-auto max-h-[60vh] overflow-y-auto w-full animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Top Results</p>
                        {searchResults.map(tag => (
                            <div
                                key={tag._id}
                                onClick={() => handleResultClick(tag)}
                                className="flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors border-b border-zinc-50 last:border-0"
                            >
                                <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    {tag.image ? (
                                        <img src={tag.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="w-6 h-6 text-zinc-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                            {tag.displayText}
                                        </h4>
                                        {tag.price && (
                                            <span className="text-sm font-bold text-green-600">₹{tag.price}/kg</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                        <span className="truncate max-w-[150px]">{tag.subText}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            {(tag.distance ? tag.distance / 1000 : 0).toFixed(1)} km
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapEvents
                    onMapClick={() => setSelectedVendor(null)}
                    onMoveEnd={(newCenter) => {
                        if (isProgrammaticMove.current) {
                            isProgrammaticMove.current = false;
                        } else {
                            setSearchCenter(newCenter);
                            setCenter(newCenter);
                        }
                    }}
                />
                {shouldRecenter && <RecenterMap center={center} />}

                {/* My Location */}
                {userLocation && <Marker position={userLocation} icon={myLocationIcon} />}

                {/* Vendors (Showing ALL loaded vendors, not just filtered ones) */}
                {Object.values(vendors).map(vendor => (
                    <Marker
                        key={vendor._id}
                        position={[vendor.lat, vendor.lng]}
                        icon={
                            vendor.isStatic
                                ? getStoreIcon(vendor.isOnline)
                                : getRotatedVendorIcon(vendor.bearing || 0)
                        }
                        eventHandlers={{
                            click: () => {
                                isProgrammaticMove.current = true;
                                setSelectedVendor(vendor);
                                setShouldRecenter(false);
                            }
                        }}
                    />
                ))}
            </MapContainer>

            {/* Vendor Card Overlay */}
            {selectedVendor && (
                <VendorCard
                    vendor={selectedVendor}
                    onClose={() => setSelectedVendor(null)}
                    isFavorite={favorites.includes(selectedVendor._id)}
                    onToggleFavorite={() => toggleFavorite(selectedVendor._id)}
                />
            )}

            {/* Recenter Button */}
            {!shouldRecenter && (
                <Button
                    className="absolute bottom-24 right-4 z-[400] rounded-full shadow-lg"
                    size="icon"
                    onClick={() => {
                        setShouldRecenter(true);
                        if (userLocation) {
                            setCenter(userLocation);
                        } else {
                            navigator.geolocation.getCurrentPosition(pos => {
                                const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                                setCenter(loc);
                                setUserLocation(loc);
                            });
                        }
                    }}
                >
                    <Navigation className="w-5 h-5" />
                </Button>
            )}
        </div>
    );
}
