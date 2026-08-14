"use client";

import type Lenis from "lenis";

/**
 * Module-level handle on the running Lenis instance.
 *
 * Overlays need to freeze the page behind them. `overflow: hidden` on the body
 * is not enough on its own: Lenis drives scrolling from wheel and touch events
 * on the window, so it keeps moving underneath. Anything that opens a modal
 * calls `stop()` here and `start()` on close.
 */
let instance: Lenis | null = null;

export function setLenis(next: Lenis | null): void {
  instance = next;
}

export function stopLenis(): void {
  instance?.stop();
}

export function startLenis(): void {
  instance?.start();
}
