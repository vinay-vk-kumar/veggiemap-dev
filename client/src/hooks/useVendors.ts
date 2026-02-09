import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMapStore } from "@/store/useMapStore";
import api from "@/lib/api";

export interface VendorMarker {
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
    minPrice?: number;
    location?: { coordinates: [number, number] };
}

export function useVendors() {
    const { center, filters, bounds, searchQuery, setSearchQuery } = useMapStore();
    const [debouncedBounds, setDebouncedBounds] = useState(bounds);
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Debounce Bounds (Wait until map stops moving for 300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBounds(bounds);
        }, 300);
        return () => clearTimeout(timer);
    }, [bounds]);

    const queryKey = useMemo(() => {
        if (!center) return ['vendors', 'loading'];

        // We included debouncedBounds in key to trigger refetch
        // We include debouncedQuery
        const bKey = debouncedBounds ? `${debouncedBounds.southWest.lat},${debouncedBounds.southWest.lng}-${debouncedBounds.northEast.lat},${debouncedBounds.northEast.lng}` : 'nobounds';
        const fKey = JSON.stringify(filters);

        return ['vendors-v3.4', bKey, fKey, debouncedQuery];
    }, [center, debouncedBounds, filters, debouncedQuery]);

    const queryResults = useQuery({
        queryKey,
        queryFn: async () => {
            if (!center) return [];
            console.log("Fetching vendors for", queryKey);

            const params: any = {
                lat: center[0],
                lng: center[1],
                maxDistance: filters.maxDistance,
                category: filters.category,
                query: debouncedQuery // Pass search query to backend
            };

            // Add Bounding Box params if available
            if (debouncedBounds) {
                params.sw_lat = debouncedBounds.southWest.lat;
                params.sw_lng = debouncedBounds.southWest.lng;
                params.ne_lat = debouncedBounds.northEast.lat;
                params.ne_lng = debouncedBounds.northEast.lng;
            }

            const res = await api.get('/consumer/search', { params });

            const currentLoc = useMapStore.getState().userLocation || center;

            // Transform
            return res.data.map((v: any) => {
                const vLat = v.location?.coordinates?.[1] || 0;
                const vLng = v.location?.coordinates?.[0] || 0;

                // Calculate distance if missing or 0 (common with BBox)
                let dist = v.distance;
                if ((!dist || dist === 0) && currentLoc) {
                    dist = getDistanceFromLatLonInKm(
                        currentLoc[0], currentLoc[1],
                        vLat, vLng
                    ) * 1000; // Convert to meters
                }

                return {
                    ...v,
                    lat: vLat,
                    lng: vLng,
                    distance: dist,
                    isStatic: v.vendorType === 'static',
                };
            }) as VendorMarker[];
        },
        enabled: !!center,
        staleTime: 0, // Always fetch fresh data on map move
        refetchInterval: 10000, // 10s Polling for status updates
        placeholderData: (prev) => prev
    });

    return {
        ...queryResults,
        searchQuery,
        setSearchQuery
    };
}

// Helper: Haversine Formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}
