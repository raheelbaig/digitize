"use client";

import { useState } from "react";
import { ProductPlate } from "./ProductPlate";
import { Lightbox, type PlateItem } from "./Lightbox";
import { cn } from "@/lib/utils/cn";

/**
 * A grid of archival plates that opens into the full-screen viewer.
 *
 * Opening is on click, never on hover: a viewer that appears because the
 * pointer drifted across a thumbnail is hostile, and hover does not exist on
 * touch at all. Hovering keeps its own quieter feedback — the plate lifts and
 * the product eases up a few percent.
 */
export function PlateGrid({
  items,
  className,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  items: readonly PlateItem[];
  className?: string;
  columns?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className={cn("grid gap-3", columns, className)}>
        {items.map((item, i) => (
          <ProductPlate
            key={item.id}
            id={item.id}
            alt={item.alt}
            delay={(i % 4) * 0.04}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>

      <Lightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
