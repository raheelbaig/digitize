"use client";

import { useSyncExternalStore } from "react";

function makeStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    getSnapshot() {
      return window.matchMedia(query).matches;
    },
  };
}

const cache = new Map<string, ReturnType<typeof makeStore>>();

export function useMediaQuery(query: string, serverValue = false): boolean {
  let store = cache.get(query);
  if (!store) {
    store = makeStore(query);
    cache.set(query, store);
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverValue);
}

/** Desktop-class pointer: the only place heavy scroll choreography runs. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** True for real mice/trackpads — gates the custom cursor and hover effects. */
export function useHasFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
