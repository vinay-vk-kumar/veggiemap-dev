"use client";

import * as React from "react";

type LatLng = { lat: number; lng: number };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Smoothly interpolates a moving marker between updates.
 * Keeps UI responsive even when socket updates are bursty.
 */
export function useSmoothMarkerPosition(
  target: LatLng | null,
  opts?: { durationMs?: number }
) {
  const durationMs = opts?.durationMs ?? 600;

  const [pos, setPos] = React.useState<LatLng | null>(target);
  const prevRef = React.useRef<LatLng | null>(target);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!target) return;

    const from = prevRef.current ?? target;
    const to = target;
    prevRef.current = to;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setPos({
        lat: lerp(from.lat, to.lat, t),
        lng: lerp(from.lng, to.lng, t),
      });
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target?.lat, target?.lng, durationMs]);

  return pos;
}

