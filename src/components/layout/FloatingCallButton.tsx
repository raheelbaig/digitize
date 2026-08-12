"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Phone } from "lucide-react";
import { CONTACT } from "@/data/site";
import { BEZIER } from "@/lib/animations/easing";

/**
 * Persistent path to the phone. Appears once the hero is behind you and
 * retires over the closing CTA, where a much larger call action already sits —
 * two competing buttons in one viewport would cheapen both.
 */
export function FloatingCallButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const past = y > window.innerHeight * 0.9;
      const doc = document.documentElement;
      const nearEnd =
        y + window.innerHeight > doc.scrollHeight - window.innerHeight * 1.15;
      setVisible(past && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.55, ease: BEZIER.outExpo }}
          className="fixed right-[var(--spacing-gutter)] bottom-6 left-[var(--spacing-gutter)] sm:left-auto"
          style={{ zIndex: "var(--z-floating-cta)" }}
        >
          <a
            href={CONTACT.phoneHref}
            data-cursor="call"
            className="group flex items-center justify-center gap-3 rounded-full border border-bone/15 bg-ink-900/85 px-5 py-3.5 text-sm text-bone shadow-[var(--shadow-lift)] backdrop-blur-xl transition-colors duration-300 hover:border-thread-yellow/60 hover:text-thread-yellow sm:justify-start"
          >
            <span className="relative grid size-7 place-items-center rounded-full bg-thread-yellow text-ink">
              <Phone className="size-3.5" aria-hidden="true" />
              <span className="absolute inset-0 animate-ping rounded-full bg-thread-yellow/40 [animation-duration:2.8s]" />
            </span>
            <span className="font-medium">Call Digitize Are Us</span>
            <span className="font-mono text-xs opacity-55 transition-opacity group-hover:opacity-90">
              {CONTACT.phone}
            </span>
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
