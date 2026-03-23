"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "@/context/SocketContext";
import { Icon, divIcon } from "leaflet";
import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useMapStore } from "@/store/useMapStore";
import { useVendors, VendorMarker } from "@/hooks/useVendors";
import useSupercluster from "use-supercluster";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { SearchBar } from "@/components/map-ui/SearchBar";
import { FilterChips } from "@/components/map-ui/FilterChips";
import { VendorListSheet } from "@/components/map-ui/VendorListSheet";
import { useConsumerRealtimeVendors } from "@/features/consumerMap/useConsumerRealtimeVendors";
import { VendorDetailSheet } from "@/components/vendor/VendorDetailSheet";
// import { useSearchParams } from "next/navigation";

// --- Icons (Same as before) ---
const vendorIcon = new Icon({
    iconUrl: "https://cdni.iconscout.com/illustration/premium/thumb/vegetable-seller-is-wearing-mask-and-pushing-the-vegetable-wooden-cart-illustration-svg-download-png-2259546.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});
const storeIcon = new Icon({
    iconUrl: "https://img.icons8.com/fluency/96/stall.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});
const storeOfflineIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1055/1055644.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    className: "grayscale"
});
const myLocationIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const fetchClusterIcon = (count: number) => {
    return divIcon({
        html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white shadow-md">${count}</div>`,
        className: "marker-cluster-custom",
        iconSize: [32, 32],
    });
};

function MapEvents() {
    const map = useMap();
    const setCenter = useMapStore(s => s.setCenter);
    const setZoom = useMapStore(s => s.setZoom);
    const setBounds = useMapStore(s => s.setBounds);

    // Initial Bounds Set
    useEffect(() => {
        if (map) {
            const b = map.getBounds();
            setBounds({
                northEast: { lat: b.getNorth(), lng: b.getEast() },
                southWest: { lat: b.getSouth(), lng: b.getWest() }
            });
        }
    }, [map, setBounds]);

    useMapEvents({
        moveend: () => {
            const newCenter = map.getCenter();
            const newZoom = map.getZoom();
            const b = map.getBounds();

            setCenter([newCenter.lat, newCenter.lng]);
            setZoom(newZoom);

            // Optimized Move Handling: The store updates debounced logic in hook
            setBounds({
                northEast: { lat: b.getNorth(), lng: b.getEast() },
                southWest: { lat: b.getSouth(), lng: b.getWest() }
            });
        }
    });
    return null;
}

function RecenterMap() {
    const map = useMap();
    const center = useMapStore(s => s.center);

    // Only fly if distance is significant to avoid jitter
    useEffect(() => {
        if (center) {
            const current = map.getCenter();
            const dist = map.distance(current, center);
            if (dist > 50) {
                map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
            }
        }
    }, [center, map]);

    return null;
}

export default function ConsumerMapV3() {
    const { socket } = useSocket();
    const searchParams = useSearchParams();

    // Zustand State
    const {
        center, userLocation, zoom, mode, selectedVendorId, filters, bounds, searchQuery,
        setCenter, setUserLocation, setMode, setSelectedVendorId, setZoom, setSearchQuery, setFilters
    } = useMapStore();

    // Favorites State
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isVendorListOpen, setIsVendorListOpen] = useState(false);
    const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await api.get('/consumer/favorites');
                // Assuming API returns populated objects, map to IDs
                const ids = res.data.map((v: any) => v._id);
                setFavorites(ids);
            } catch (err) {
                console.error("Failed to fetch favorites", err);
            }
        };
        fetchFavorites();
    }, []);

    const handleToggleFavorite = async (vendorId: string) => {
        try {
            const res = await api.post(`/consumer/favorites/${vendorId}`);
            const status = res.data.status; // 'added' or 'removed'
            if (status === 'added') {
                setFavorites(prev => [...prev, vendorId]);
                toast.success("Added to favorites");
            } else {
                setFavorites(prev => prev.filter(id => id !== vendorId));
                toast.success("Removed from favorites");
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
            toast.error("Failed to update favorites");
        }
    };

    // 1. Initial Location Setup & Deep Linking
    // 1a. Deep Linking Effect
    useEffect(() => {
        const vendorId = searchParams.get("vendorId");
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");

        if (vendorId && lat && lng) {
            const location: [number, number] = [parseFloat(lat), parseFloat(lng)];
            // Only update if we are not already focused on this vendor or far away
            // But since this effect runs on params change, it's safer to just set it.
            // The key is NOT to depend on 'center' here.
            setCenter(location);
            setZoom(18);
            setSelectedVendorId(vendorId);
            setMode('tracking');
        }
    }, [searchParams, setCenter, setZoom, setSelectedVendorId, setMode]);

    // 1b. Initial Geolocation Effect (Only if no center and no deep link)
    useEffect(() => {
        // Skip if deep link is active (will be handled by above effect)
        if (searchParams.get("vendorId")) return;

        if (!center && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setCenter(loc);
                    setUserLocation(loc);
                    setMode('tracking');
                },
                (err) => {
                    console.error("Loc Error", err);
                    setCenter([28.6139, 77.2090]); // Default Delhi
                }
            );
        }
    }, [center, searchParams, setCenter, setUserLocation, setMode]);

    // 1c. Join geo room for realtime updates (same contract as `ConsumerMap.tsx`)
    const roomRef = useRef<string | null>(null);
    useEffect(() => {
        if (!socket || !center) return;

        const [lat, lng] = center;
        const newRoom = `geo-${Math.floor(lat)}-${Math.floor(lng)}`;

        if (newRoom !== roomRef.current) {
            socket.emit("consumer:join-room", {
                lat,
                lng,
                previousRoom: roomRef.current
            });
            roomRef.current = newRoom;
        }
    }, [socket, center]);

    // 2. Data from Hook
    const { data: vendors = [] } = useVendors();

    // 2b. Realtime overlay (socket)
    const realtime = useConsumerRealtimeVendors(socket);

    // 3. Handle Specific Vendor (Deep Link / Selected) that might be missing from search (e.g. Offline)
    const [extraVendor, setExtraVendor] = useState<VendorMarker | null>(null);

    useEffect(() => {
        if (selectedVendorId) {
            const inList = (vendors as VendorMarker[]).find(v => v._id === selectedVendorId);
            if (!inList) {
                // Fetch individually
                api.get(`/consumer/vendor/${selectedVendorId}`)
                    .then(res => {
                        const v = res.data;
                        if (v) {
                            const vLat = v.location?.coordinates?.[1] || 0;
                            const vLng = v.location?.coordinates?.[0] || 0;
                            setExtraVendor({
                                ...v,
                                lat: vLat,
                                lng: vLng,
                                isStatic: v.vendorType === 'static',
                                // Ensure menu is array
                                menu: v.menu || []
                            });
                        }
                    })
                    .catch(err => console.error("Failed to load extra vendor", err));
            } else {
                setExtraVendor(null); // Clear if found in main list
            }
        } else {
            setExtraVendor(null);
        }
    }, [selectedVendorId, vendors]);

    // Merge vendors for display
    const visibleVendors = useMemo(() => {
        if (extraVendor) {
            // Check if already in list to avoid dupe (double check)
            if (vendors.find(v => v._id === extraVendor._id)) return vendors;
            return [...vendors, extraVendor];
        }
        return vendors;
    }, [vendors, extraVendor]);

    // Apply realtime patch (location/status) to any visible vendors
    const mergedVendors = useMemo(() => {
        return (visibleVendors as VendorMarker[]).map((v) => {
            const patch = realtime[v._id];
            if (!patch) return v;
            return {
                ...v,
                ...patch,
            } as VendorMarker;
        });
    }, [visibleVendors, realtime]);

    const selectedVendor = useMemo(() =>
        (mergedVendors as VendorMarker[]).find(v => v._id === selectedVendorId),
        [mergedVendors, selectedVendorId]);

    useEffect(() => {
        setIsVendorDetailOpen(!!selectedVendorId);
    }, [selectedVendorId]);

    const handleMyLoc = () => {
        navigator.geolocation.getCurrentPosition(pos => {
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setCenter(loc);
            setUserLocation(loc); // Update user location
            setMode('tracking');
        });
    };

    // --- Clustering Logic ---
    const points = useMemo(() => mergedVendors.map(v => ({
        type: "Feature",
        properties: {
            cluster: false,
            vendorId: v._id,
            vendor: v,
            category: 'vendor'
        },
        geometry: {
            type: "Point",
            coordinates: [v.lng, v.lat]
        }
    })), [mergedVendors]);

    const mapBounds = useMemo(() => {
        if (!bounds) return [-180, -85, 180, 85] as [number, number, number, number];
        return [
            bounds.southWest.lng,
            bounds.southWest.lat,
            bounds.northEast.lng,
            bounds.northEast.lat
        ] as [number, number, number, number];
    }, [bounds]);

    const { clusters, supercluster } = useSupercluster({
        points,
        bounds: mapBounds,
        zoom: zoom,
        options: { radius: 75, maxZoom: 17 } // Stop clustering at zoom 17
    });

    if (!center) return (
        <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden flex flex-col">
            {/* Map Background Skeleton Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

            {/* Top UI Skeleton */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-10 flex flex-col gap-3">
                <div className="h-14 w-full bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 animate-pulse flex items-center px-4 gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 w-24 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Center Loading Indicator */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-4">
                <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center animate-bounce border border-zinc-100 dark:border-zinc-800">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
                <div className="text-zinc-500 font-medium text-sm animate-pulse">Finding fresh vendors nearby...</div>
            </div>
        </div>
    );

    return (
        <div className="relative h-full w-full">
            {/* Overlay UI (Search + Chips) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-400 flex flex-col gap-3">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    results={vendors as VendorMarker[]}
                    onPickResult={(vendor) => {
                        setCenter([vendor.lat, vendor.lng]);
                        setZoom(18);
                        setSelectedVendorId(vendor._id);
                        setIsVendorDetailOpen(true);
                    }}
                />

                <FilterChips
                    chips={[
                        {
                            id: "all",
                            label: "All",
                            selected: filters.category === "all",
                            onClick: () => setFilters({ category: "all" }),
                        },
                        {
                            id: "vegetable",
                            label: "Vegetables",
                            selected: filters.category === "vegetable",
                            onClick: () => setFilters({ category: "vegetable" }),
                        },
                        {
                            id: "fruit",
                            label: "Fruits",
                            selected: filters.category === "fruit",
                            onClick: () => setFilters({ category: "fruit" }),
                        },
                    ]}
                />

                <div className="pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setIsVendorListOpen(true)}
                        className="w-full rounded-2xl px-4 py-3 border border-border bg-background/90 supports-backdrop-filter:bg-background/70 backdrop-blur-xl shadow-sm text-left"
                    >
                        <div className="text-sm font-semibold text-foreground">
                            Nearby vendors
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            Tap to view list
                        </div>
                    </button>
                </div>
            </div>

            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false}
                ref={(map) => {
                    if (map) {
                        // Leaflet doesn't strictly follow React ref pattern for updating,
                        // but we can use this if we need direct map access outside hooks
                    }
                }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapEvents />
                <RecenterMap />

                {/* Clusters & Markers */}
                {clusters.map((cluster) => {
                    const [longitude, latitude] = cluster.geometry.coordinates;
                    const { cluster: isCluster, point_count: pointCount } = cluster.properties;

                    if (isCluster) {
                        return (
                            <Marker
                                key={`cluster-${cluster.id}`}
                                position={[latitude, longitude]}
                                icon={fetchClusterIcon(pointCount)}
                                eventHandlers={{
                                    click: () => {
                                        const expansionZoom = Math.min(
                                            supercluster!.getClusterExpansionZoom(cluster.id),
                                            18
                                        );
                                        setCenter([latitude, longitude]);
                                        setZoom(expansionZoom);
                                    }
                                }}
                            />
                        );
                    }

                    // Individual Vendor Marker
                    const vendor = cluster.properties.vendor as VendorMarker;
                    return (
                        <Marker
                            key={vendor._id}
                            position={[vendor.lat, vendor.lng]}
                            icon={vendor.isStatic
                                ? (vendor.isOnline ? storeIcon : storeOfflineIcon)
                                : vendorIcon}
                            eventHandlers={{
                                click: () => {
                                    setSelectedVendorId(vendor._id);
                                    setIsVendorDetailOpen(true);
                                }
                            }}
                        />
                    );
                })}

                {/* My Location Marker (Fixed GPS) */}
                {userLocation && <Marker position={userLocation} icon={myLocationIcon} />}
            </MapContainer>

            {/* Bottom Controls */}
            <div className="absolute bottom-24 right-4 z-400 flex flex-col gap-2 pointer-events-auto">
                <Button size="icon" className="rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700" onClick={handleMyLoc}>
                    <Navigation className="w-5 h-5" />
                </Button>
            </div>

            <VendorListSheet
                open={isVendorListOpen}
                onOpenChange={setIsVendorListOpen}
                vendors={mergedVendors as VendorMarker[]}
                activeVendorId={selectedVendorId}
                onPickVendor={(vendor) => {
                    setIsVendorListOpen(false);
                    setCenter([vendor.lat, vendor.lng]);
                    setZoom(18);
                    setSelectedVendorId(vendor._id);
                    setIsVendorDetailOpen(true);
                }}
            />

            {selectedVendor ? (
                <VendorDetailSheet
                    vendor={selectedVendor as any}
                    open={isVendorDetailOpen}
                    onOpenChange={(open) => {
                        setIsVendorDetailOpen(open);
                        if (!open) setSelectedVendorId(null);
                    }}
                    isFavorite={favorites.includes(selectedVendor._id)}
                    onToggleFavorite={() => handleToggleFavorite(selectedVendor._id)}
                />
            ) : null}
        </div>
    );
}
