"use client";

import * as React from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import type { VendorMarker } from "@/hooks/useVendors";
import { VendorRow } from "@/components/map-ui/VendorRow";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: VendorMarker[];
  activeVendorId: string | null;
  onPickVendor: (vendor: VendorMarker) => void;
};

export function VendorListSheet({
  open,
  onOpenChange,
  vendors,
  activeVendorId,
  onPickVendor,
}: Props) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${vendors.length} vendors nearby`}
    >
      <div className="space-y-3">
        {vendors.map((vendor) => (
          <VendorRow
            key={vendor._id}
            vendor={vendor}
            active={activeVendorId === vendor._id}
            onClick={() => onPickVendor(vendor)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}

