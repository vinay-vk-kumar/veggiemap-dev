"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-900" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-950",
            "rounded-t-3xl border border-border bg-background",
            "shadow-2xl outline-none",
            "max-h-[85vh] flex flex-col",
            className
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />

          {title ? (
            <div className="px-5 pt-4 pb-2">
              <Drawer.Title className="text-base font-semibold text-foreground">
                {title}
              </Drawer.Title>
            </div>
          ) : null}

          <div className="px-5 pb-6 overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

