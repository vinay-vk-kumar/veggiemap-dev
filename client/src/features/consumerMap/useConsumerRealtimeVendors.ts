"use client";

import * as React from "react";
import type { VendorMarker } from "@/hooks/useVendors";
import type { Socket } from "socket.io-client";

type RealtimePatch = Partial<Pick<VendorMarker, "lat" | "lng" | "isOnline" | "vendorType">> & {
  _id: string;
};

type RealtimeState = Record<string, RealtimePatch>;

export function useConsumerRealtimeVendors(socket: Socket | null) {
  const [realtime, setRealtime] = React.useState<RealtimeState>({});

  React.useEffect(() => {
    if (!socket) return;

    const handleLocationMove = (data: any) => {
      const { vendorId, location } = data || {};
      if (!vendorId || !location) return;

      setRealtime((prev) => ({
        ...prev,
        [vendorId]: {
          ...(prev[vendorId] || { _id: vendorId }),
          _id: vendorId,
          lat: location.lat,
          lng: location.lng,
          vendorType: "mobile",
          isOnline: true,
        },
      }));
    };

    const handleVendorRemoved = (data: { vendorId: string }) => {
      const id = data?.vendorId;
      if (!id) return;

      setRealtime((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    const handleStatusUpdate = (data: { vendorId: string; isOnline: boolean }) => {
      const id = data?.vendorId;
      if (!id) return;

      setRealtime((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || { _id: id }),
          _id: id,
          isOnline: data.isOnline,
        },
      }));
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

  return realtime;
}

