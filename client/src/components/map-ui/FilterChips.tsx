"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Chip = {
  id: string;
  label: string;
  onClick: () => void;
  selected?: boolean;
};

type Props = {
  chips: Chip[];
};

export function FilterChips({ chips }: Props) {
  return (
    <div className="pointer-events-auto flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide w-full mask-image-fade">
      {chips.map((chip, idx) => {
        return (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={chip.onClick}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all duration-300 shadow-sm border",
              chip.selected
                ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md ring-2 ring-zinc-900/20 dark:ring-white/20 ring-offset-1 dark:ring-offset-black"
                : "bg-white/90 supports-backdrop-filter:bg-white/70 backdrop-blur-xl dark:bg-zinc-950/90 dark:supports-backdrop-filter:bg-zinc-950/70 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-800/80 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
            )}
          >
            {chip.label}
          </motion.button>
        );
      })}
    </div>
  );
}
