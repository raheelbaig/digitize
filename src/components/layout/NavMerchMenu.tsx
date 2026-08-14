"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { PRODUCT_CATEGORIES, ACCENT_VAR, categoryHref } from "@/data/products";
import { IMAGES } from "@/data/generated/images";
import { BEZIER } from "@/lib/animations/easing";
import { useHasFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

/**
 * The Custom Merch nav item: a link to the section index that reveals the eight
 * families on hover.
 *
 * Built as a disclosure rather than an ARIA menu — the contents are links, not
 * commands, so a menu role would mislead screen readers about what Enter does.
 * The panel opens on pointer intent and on keyboard focus, closes on Escape,
 * on blur out of the group, and whenever the route changes.
 */
export function NavMerchMenu({
  href,
  label,
  compact,
}: {
  href: string;
  label: string;
  compact: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fine = useHasFinePointer();
  const reduced = useReducedMotion();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  // A short grace period lets the pointer cross the gap to the panel.
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      wrap.current?.querySelector<HTMLElement>("[data-merch-trigger]")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={wrap}
      className="relative"
      onPointerEnter={() => {
        if (!fine) return;
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={() => fine && scheduleClose()}
      onFocus={() => {
        cancelClose();
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Link
        href={href}
        data-merch-trigger
        data-cursor="link"
        aria-expanded={open}
        onClick={() => setOpen(false)}
        className="group relative flex items-center gap-1.5 py-1 text-sm text-bone/70 transition-colors duration-300 hover:text-bone"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 transition-transform duration-400 ease-[var(--ease-out-expo)]",
            open && "rotate-180",
          )}
        />
        <span
          className={cn(
            "absolute inset-x-0 -bottom-0.5 h-px origin-left bg-brand-green transition-transform duration-500 ease-[var(--ease-out-expo)]",
            open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </Link>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reduced ? 0.12 : 0.42, ease: BEZIER.outExpo }}
            // sits below the bar, clear of the compact pill's rounded edge
            className={cn(
              "absolute left-1/2 z-10 w-[min(41rem,calc(100vw-2rem))] -translate-x-1/2",
              compact ? "top-[calc(100%+1.15rem)]" : "top-[calc(100%+1.6rem)]",
            )}
            style={{ transformOrigin: "top center" }}
          >
            <div className="overflow-hidden rounded-2xl border border-bone/12 bg-ink-900/90 p-2.5 shadow-[var(--shadow-lift)] backdrop-blur-2xl">
              <ul className="grid grid-cols-2 gap-1">
                {PRODUCT_CATEGORIES.map((category, i) => {
                  const asset = IMAGES[category.heroImage];
                  return (
                    <motion.li
                      key={category.slug}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: reduced ? 0 : 0.04 + i * 0.028,
                        ease: BEZIER.outExpo,
                      }}
                    >
                      <Link
                        href={categoryHref(category.slug)}
                        onClick={() => setOpen(false)}
                        data-cursor="link"
                        className="group flex items-center gap-3 rounded-xl p-2 transition-colors duration-300 hover:bg-bone/6"
                      >
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-white">
                          <Image
                            src={asset.src}
                            alt=""
                            fill
                            sizes="44px"
                            quality={80}
                            className="object-contain p-1"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="block size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: ACCENT_VAR[category.accent] }}
                            />
                            <span className="truncate text-sm font-medium text-bone">
                              {category.title}
                            </span>
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.6875rem] tracking-tight text-smoke">
                            {category.variants.length} constructions
                          </span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <Link
                href={href}
                onClick={() => setOpen(false)}
                data-cursor="link"
                className="mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm text-bone/70 transition-colors duration-300 hover:bg-bone/6 hover:text-bone"
              >
                See every family
                <span className="stitch-line h-px w-16 text-bone/40" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
