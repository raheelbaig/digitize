"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "@/lib/animations/gsap";
import { EASE } from "@/lib/animations/easing";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BrandMark } from "@/components/brand/BrandMark";

type Phase = "loading" | "revealing" | "done";

const IntroContext = createContext<{ ready: boolean }>({ ready: false });

/** True once the loader has begun clearing, i.e. the hero may start. */
export function useIntroReady(): boolean {
  return useContext(IntroContext).ready;
}

/**
 * A single stitch draws across the dark, the mark resolves on it, and the
 * curtain lifts. Total ~1.5s, and skipped outright under reduced motion.
 */
export function IntroProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const overlayRef = useRef<HTMLDivElement>(null);
  const stitchRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  // Reduced motion skips the curtain entirely — derived, not stored, so the
  // effect never has to push state back into React.
  const ready = reduced || phase !== "loading";
  const showOverlay = !reduced && phase !== "done";

  useEffect(() => {
    // No mount guard here: StrictMode's remount would trip it and strand the
    // curtain. The timeline is idempotent and the cleanup kills it instead.
    if (reduced) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    document.body.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        setPhase("done");
      },
    });

    // Kept tight — the curtain gates LCP, so every extra beat is a real cost.
    tl.fromTo(
      stitchRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.5, ease: "power2.inOut" },
    )
      .fromTo(
        markRef.current,
        { opacity: 0, scale: 0.86 },
        { opacity: 1, scale: 1, duration: 0.45, ease: EASE.out },
        "-=0.2",
      )
      .to(stitchRef.current, { opacity: 0, duration: 0.28 }, "-=0.08")
      .add(() => setPhase("revealing"))
      .to(overlay, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.7,
        ease: EASE.out,
      })
      .set(overlay, { pointerEvents: "none" });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [reduced]);

  return (
    <IntroContext.Provider value={{ ready }}>
      {showOverlay ? (
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="fixed inset-0 grid place-items-center bg-ink"
          style={{ zIndex: "var(--z-loader)", clipPath: "inset(0% 0% 0% 0%)" }}
        >
          <div className="relative flex flex-col items-center gap-6">
            <div ref={markRef} style={{ opacity: 0 }}>
              <BrandMark className="h-12 w-auto" title={false} />
            </div>
            <span
              ref={stitchRef}
              className="stitch-line block h-px w-40 origin-left text-bone/55"
            />
          </div>
        </div>
      ) : null}
      {children}
    </IntroContext.Provider>
  );
}
