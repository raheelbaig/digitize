"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, CONTACT } from "@/data/site";
import { Wordmark } from "@/components/brand/BrandMark";
import { BEZIER } from "@/lib/animations/easing";
import { cn } from "@/lib/utils/cn";

/**
 * Transparent and wide at the top of the page; after the first viewport it
 * contracts into a floating blurred bar. No mega menu — five anchors and a
 * phone number is the whole information architecture.
 */
export function Navbar() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact(y > window.innerHeight * 0.6);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet on Escape, and lock the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 flex justify-center"
        style={{ zIndex: "var(--z-nav)" }}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "mt-0 flex w-full items-center justify-between gap-8 px-[var(--spacing-gutter)] py-5",
            "transition-[max-width,margin,padding,background-color,border-color,backdrop-filter] duration-700 ease-[var(--ease-out-expo)]",
            compact
              ? "mt-3 max-w-[62rem] rounded-full border border-bone/12 bg-ink-900/70 px-6 py-3 backdrop-blur-xl"
              : "max-w-[var(--container-shell)] border border-transparent",
          )}
        >
          <a
            href="#top"
            aria-label={`${"Digitize Are Us"} — back to top`}
            data-cursor="link"
            className="shrink-0"
          >
            <Wordmark markClassName={compact ? "h-6" : "h-7"} />
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  data-cursor="link"
                  className="group relative block py-1 text-sm text-bone/70 transition-colors duration-300 hover:text-bone"
                >
                  {link.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-thread-yellow transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href={CONTACT.phoneHref}
              data-cursor="call"
              className="hidden rounded-full border border-bone/25 px-5 py-2 font-mono text-xs tracking-tight text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink sm:block"
            >
              {CONTACT.phone}
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid size-9 place-items-center rounded-full border border-bone/20 text-bone transition-colors hover:border-bone/60 lg:hidden"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: BEZIER.outExpo }}
            className="fixed inset-0 bg-ink/95 backdrop-blur-xl lg:hidden"
            style={{ zIndex: "calc(var(--z-nav) + 1)" }}
          >
            <div className="flex h-full flex-col px-[var(--spacing-gutter)] py-5">
              <div className="flex items-center justify-between">
                <Wordmark />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-9 place-items-center rounded-full border border-bone/20 text-bone"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <ul className="mt-auto mb-auto flex flex-col gap-2">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.06 + i * 0.06,
                      ease: BEZIER.outExpo,
                    }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="display block py-2 text-[clamp(2.25rem,11vw,3.5rem)]"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <a
                href={CONTACT.phoneHref}
                className="rounded-full bg-bone px-6 py-4 text-center text-sm font-medium text-ink"
              >
                Call {CONTACT.phone}
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
