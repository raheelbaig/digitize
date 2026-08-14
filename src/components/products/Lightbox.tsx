"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { IMAGES, type ImageId } from "@/data/generated/images";
import { BEZIER } from "@/lib/animations/easing";
import { startLenis, stopLenis } from "@/lib/animations/lenisRef";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type PlateItem = {
  readonly id: ImageId;
  readonly alt: string;
  /** Small caption under the image, e.g. the family name. */
  readonly caption?: string;
};

/**
 * How far past its own pixels a plate may be drawn in the viewer, and the
 * absolute ceiling regardless.
 *
 * A strict 1:1 cap sounded right but measured badly: the smallest plates are
 * under 300px, so the viewer opened them at the same size as the grid and gave
 * the visitor nothing. 1.5x is enough to feel like an enlargement while staying
 * inside what the Lanczos-sharpened sources tolerate, and 760px stops a ~300px
 * photograph from ever being stretched across a 1440px screen.
 */
const MAX_SCALE = 1.5;
const MAX_WIDTH = 760;

function displayWidth(intrinsic: number): number {
  return Math.min(Math.round(intrinsic * MAX_SCALE), MAX_WIDTH);
}

/**
 * Full-screen viewer for a set of plates.
 *
 * The image is never drawn wider than its own intrinsic pixels. The portfolio's
 * photography tops out around 600px after processing, and blowing that up to
 * fill a 1440px viewport would put the material's weakest quality on the
 * biggest possible canvas. Instead the *frame* is generous — dark ground, white
 * plate, caption, counter — while the picture stays at 1:1 and sharp. When real
 * high-resolution photography replaces these files, the same viewer opens
 * larger automatically, because the cap is read from the asset.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: readonly PlateItem[];
  /** null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const open = index !== null;
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** Restores focus to whatever opened the viewer. */
  const opener = useRef<HTMLElement | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onNavigate((index + delta + items.length) % items.length);
    },
    [index, items.length, onNavigate],
  );

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // Three locks, because one is not enough here: Lenis drives scrolling from
    // window events, the scrolling element is <html> rather than <body>, and a
    // stopped Lenis still lets the native wheel through.
    stopLenis();
    const root = document.documentElement;
    const prevRoot = root.style.overflow;
    const prevBody = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const blockScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== "Tab") return;

      // keep focus inside the dialog
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      root.style.overflow = prevRoot;
      document.body.style.overflow = prevBody;
      startLenis();
      opener.current?.focus?.();
    };
  }, [open, onClose, step]);

  const item = index === null ? null : items[index];
  const asset = item ? IMAGES[item.id] : null;

  return (
    <AnimatePresence>
      {open && item && asset ? (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={item.caption ? `${item.caption} — enlarged view` : "Enlarged view"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.3, ease: BEZIER.outExpo }}
          // Deliberately translucent: the archive's bone surface glows through
          // and lifts the whole overlay. The heavier blur keeps the plates
          // behind from reading as detail and competing with the one on top.
          className="fixed inset-0 flex flex-col bg-ink/70 backdrop-blur-2xl"
          style={{ zIndex: "calc(var(--z-loader) + 5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* ---- bar ---- */}
          <div className="flex shrink-0 items-center justify-between gap-4 px-[var(--spacing-gutter)] py-5">
            {/* Brighter than the site's usual label: the translucent backdrop
                sits far lighter than the page, and smoke-grey drops under 3:1
                against it. */}
            <p className="label-tech text-bone/70">
              {item.caption ? `${item.caption} · ` : ""}
              <span className="tabular-nums text-bone">
                {(index ?? 0) + 1} / {items.length}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close enlarged view"
              className="grid size-10 place-items-center rounded-full border border-bone/20 text-bone transition-colors hover:border-bone/60 hover:bg-bone hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* ---- plate ---- */}
          <div
            className="flex min-h-0 flex-1 items-center justify-center gap-3 px-[var(--spacing-gutter)] pb-6 sm:gap-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            {items.length > 1 ? (
              <StepButton direction="prev" onClick={() => step(-1)} />
            ) : null}

            <motion.figure
              key={item.id}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0.1 : 0.45, ease: BEZIER.outExpo }}
              className="flex min-h-0 min-w-0 flex-col items-center"
            >
              <div
                className="overflow-hidden rounded-2xl bg-white p-3 shadow-[var(--shadow-lift)] sm:p-5"
                // an explicit width is required: as a centred flex item this
                // box would otherwise shrink to the image's intrinsic size and
                // the cap would never apply
                style={{
                  width: `${displayWidth(asset.width)}px`,
                  maxWidth: "92vw",
                }}
              >
                {/* Unoptimised on purpose: this is the "show me more" action,
                    and the optimiser was picking a variant narrower than the
                    file we already have. The plates are ~20-40 KB, so serving
                    the original costs nothing and guarantees every pixel. */}
                <Image
                  src={asset.src}
                  alt={item.alt}
                  width={asset.width}
                  height={asset.height}
                  unoptimized
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: "68svh" }}
                  priority
                />
              </div>
              <figcaption className="mt-4 max-w-xl text-center text-sm text-bone/80">
                {item.alt}
              </figcaption>
            </motion.figure>

            {items.length > 1 ? (
              <StepButton direction="next" onClick={() => step(1)} />
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StepButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isNext = direction === "next";
  const Icon = isNext ? ArrowRight : ArrowLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isNext ? "Next image" : "Previous image"}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-bone/20 text-bone transition-colors hover:border-bone/60 hover:bg-bone hover:text-ink sm:size-12"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
