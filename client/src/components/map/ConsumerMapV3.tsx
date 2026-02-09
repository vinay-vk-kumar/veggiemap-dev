"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "@/context/SocketContext";
import { Icon, divIcon } from "leaflet";
import { Loader2, Navigation, Search, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import VendorCard from "../consumer/VendorCard";
import { useMapStore } from "@/store/useMapStore";
import { useVendors, VendorMarker } from "@/hooks/useVendors";
import useSupercluster from "use-supercluster";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
// import { useSearchParams } from "next/navigation";

// --- Icons (Same as before) ---
const vendorIcon = new Icon({
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

    // 2. Data from Hook
    const { data: vendors = [] } = useVendors();

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

    const selectedVendor = useMemo(() =>
        (visibleVendors as VendorMarker[]).find(v => v._id === selectedVendorId),
        [visibleVendors, selectedVendorId]);

    const handleMyLoc = () => {
        navigator.geolocation.getCurrentPosition(pos => {
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setCenter(loc);
            setUserLocation(loc); // Update user location
            setMode('tracking');
        });
    };

    // --- Clustering Logic ---
    const points = useMemo(() => visibleVendors.map(v => ({
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
    })), [visibleVendors]);

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

    if (!center) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="relative h-full w-full">
            {/* Search & Filter Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[400] flex flex-col gap-3 pointer-events-auto">
                {/* Search Input */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search 'Tomatoes' or 'Raju Tea Stall'..."
                        className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-lg shadow-gray-200/50 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 placeholder:text-gray-400 font-medium transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All', 'Vegetables', 'Fruits'].map(cat => (
                        <button
                            key={cat}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all whitespace-nowrap ${filters.category === cat.toLowerCase() || (filters.category === 'all' && cat === 'All')
                                ? 'bg-zinc-800 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            onClick={() => setFilters({ category: cat.toLowerCase() })}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search Results Dropdown */}
                {searchQuery && (
                    <div className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto mt-2 divide-y divide-gray-100">
                        {vendors.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No vendors found nearby.</div>
                        ) : (
                            vendors.map(vendor => (
                                <div
                                    key={vendor._id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer flex gap-3 transition-colors"
                                    onClick={() => {
                                        setCenter([vendor.lat, vendor.lng]);
                                        setZoom(18);
                                        setSelectedVendorId(vendor._id);
                                        // setSearchQuery(""); // Keep search query or not?
                                    }}
                                >
                                    {/* Thumbnail */}
                                    {vendor.shopImage ? (
                                        <img src={vendor.shopImage} alt={vendor.vendorName} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                            <Store className="w-6 h-6" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-900 truncate">{vendor.shopName || vendor.vendorName}</h3>
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                                {((vendor.distance || 0) / 1000).toFixed(1)} km
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{vendor.vendorType} • {vendor.isOnline ? <span className="text-green-600 font-medium">Online</span> : <span className="text-gray-400">Closed</span>}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
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
                                }
                            }}
                        />
                    );
                })}

                {/* My Location Marker (Fixed GPS) */}
                {userLocation && <Marker position={userLocation} icon={myLocationIcon} />}
            </MapContainer>

            {/* Bottom Controls */}
            <div className="absolute bottom-24 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
                <Button size="icon" className="rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700" onClick={handleMyLoc}>
                    <Navigation className="w-5 h-5" />
                </Button>
            </div>

            {/* Vendor Card */}
            {selectedVendor && (
                <VendorCard
                    vendor={selectedVendor}
                    onClose={() => setSelectedVendorId(null)}
                    isFavorite={favorites.includes(selectedVendor._id)}
                    onToggleFavorite={() => handleToggleFavorite(selectedVendor._id)}
                />
            )}
        </div>
    );
}
