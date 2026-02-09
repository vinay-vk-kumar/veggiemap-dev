import { create } from 'zustand';

interface MapState {
    center: [number, number] | null;
    userLocation: [number, number] | null; // Fixed GPS location
    zoom: number;
    mode: 'browsing' | 'searching' | 'tracking';
    selectedVendorId: string | null;
    filters: {
        maxDistance: number;
        category: string;
        sortBy: string;
    };
    bounds: {
        northEast: { lat: number; lng: number };
        southWest: { lat: number; lng: number };
    } | null;
    searchQuery: string;

    // Actions
    setCenter: (center: [number, number]) => void;
    setUserLocation: (location: [number, number]) => void;
    setZoom: (zoom: number) => void;
    setMode: (mode: MapState['mode']) => void;
    setSelectedVendorId: (id: string | null) => void;
    setFilters: (filters: Partial<MapState['filters']>) => void;
    setBounds: (bounds: MapState['bounds']) => void;
    setSearchQuery: (query: string) => void;
}

export const useMapStore = create<MapState>((set) => ({
    center: null,
    userLocation: null,
    zoom: 15,
    mode: 'browsing',
    selectedVendorId: null,
    filters: {
        maxDistance: 5000,
        category: 'all',
        sortBy: 'distance'
    },
    bounds: null,
    searchQuery: "",

    setCenter: (center) => set({ center, mode: 'browsing' }), // User moved map
    setUserLocation: (location) => set({ userLocation: location }),
    setZoom: (zoom) => set({ zoom }),
    setMode: (mode) => set({ mode }),
    setSelectedVendorId: (id) => set({ selectedVendorId: id }),
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),
    setBounds: (bounds) => set({ bounds }),
    setSearchQuery: (query) => set({ searchQuery: query })
}));
