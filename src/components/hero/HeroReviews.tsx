"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, PenLine } from "lucide-react";
import type { GooglePlaceReviews, GoogleReview } from "@/lib/reviews/google";
import { writeReviewUrl } from "@/lib/reviews/write-url";
import { Stars } from "@/components/ui/Stars";
import { GoogleG } from "@/components/ui/GoogleG";
import { BrandMark } from "@/components/brand/BrandMark";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIntroReady } from "@/components/providers/Intro";
import { cn } from "@/lib/utils/cn";

/** How long each photograph holds before the next one fades up. */
const PHOTO_DWELL = 2800;

/**
 * True while the tab is in the foreground.
 *
 * A hidden tab still runs intervals, so without this a visitor who leaves and
 * comes back lands on whichever review the timer happened to reach — usually
 * mid-fade, and never the one they were reading.
 */
function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return visible;
}

/** What a photo's caption should say, given who actually uploaded it. */
function credit(photo: GoogleReview["photos"][number], author: string): string {
  return photo.credit === "customer" ? `Photo by ${author}` : "Our work";
}

/**
 * The hero's right-hand composition: the work in the frame, the customer
 * speaking over it.
 *
 * The rotation runs on **one cursor over two axes** — each tick moves to the
 * next photograph of the current review, and rolls onto the next review once
 * its photographs are spent. A single pure updater does both, so the two never
 * drift apart or double-advance under StrictMode's repeated invocation.
 *
 * Photo provenance is carried through honestly. `credit` on each photo says
 * whether the reviewer uploaded it themselves or whether it is our own work
 * filling out a card whose author posted none, and the caption reflects that
 * rather than implying every picture came from the customer.
 *
 * Google's display terms are honoured: text is verbatim, each review carries
 * its author's name and photo linking to their profile, the relative publish
 * time is kept, and the mark is shown.
 */
export function HeroReviewShowcase({ data }: { data: GooglePlaceReviews }) {
  const reviews = data.reviews;
  const count = reviews.length;

  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const ready = useIntroReady();
  const [pos, setPos] = useState({ r: 0, p: 0 });
  const [held, setHeld] = useState(false);

  const review = reviews[pos.r];
  const photos = review?.photos ?? [];
  const photo = photos[pos.p];

  // `pos` is a dependency so a manual pick restarts the dwell rather than
  // inheriting whatever was left of the previous one.
  useEffect(() => {
    if (reduced || held || !visible || count === 0) return;

    const id = window.setInterval(() => {
      setPos((at) => {
        const shown = reviews[at.r]?.photos.length ?? 0;
        if (at.p + 1 < shown) return { r: at.r, p: at.p + 1 };
        return { r: (at.r + 1) % count, p: 0 };
      });
    }, PHOTO_DWELL);

    return () => window.clearInterval(id);
  }, [reduced, held, visible, count, reviews, pos]);

  if (!review) return null;

  return (
    <div
      className="relative"
      aria-roledescription="carousel"
      aria-label={`Google reviews for ${data.name}`}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {/* ---- the work ----
          The reveal is driven by `ready` through the class list, not by a GSAP
          tween writing an inline clip-path. A tween owns that style outright,
          and `gsap.context().revert()` restores it to "fully clipped" on every
          cleanup — so any re-run that did not also replay the timeline left
          this frame shut for good. Deriving it from state re-computes on every
          render and cannot get stuck. */}
      <div
        className={cn(
          "relative h-[30rem] w-full overflow-hidden rounded-3xl border border-bone/10 bg-ink-800 shadow-(--shadow-lift) sm:h-[34rem]",
          "transition-[clip-path] duration-[1600ms] ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          ready ? "[clip-path:inset(0%)]" : "[clip-path:inset(0%_0%_100%)]",
        )}
      >
        {photos.map((photo, i) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={
              photo.credit === "customer"
                ? `Photo uploaded by ${review.author} with their Google review`
                : "Finished work from our workshop"
            }
            fill
            priority={pos.r === 0 && i === 0}
            quality={82}
            sizes="(min-width: 1024px) 30rem, 100vw"
            className={cn(
              "object-cover transition-[opacity,transform] duration-1000 ease-[var(--ease-out-expo)]",
              "motion-reduce:transition-none",
              i === pos.p ? "scale-100 opacity-100" : "scale-105 opacity-0",
            )}
          />
        ))}

        {/* Ink wash: the card below and the caption above both sit on this. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-ink via-ink/50 to-ink/18"
        />

        {photo ? (
          <span className="label-tech absolute top-5 right-5 rounded-full border border-bone/10 bg-ink-900/70 px-3 py-1.5 text-bone/80 backdrop-blur-md">
            {credit(photo, review.author)}
          </span>
        ) : null}

        {/* ---- the customer, over the work ---- */}
        <figure
          key={review.id}
          className="absolute inset-x-4 bottom-4 animate-(--animate-rise-in) rounded-3xl border border-bone/12 bg-ink-900/72 p-5 backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Stars rating={review.rating} starClassName="size-4" emptyClassName="text-bone/15" />
            <GoogleG className="size-4 shrink-0" />
          </div>

          {/* verbatim, as Google's terms require */}
          <blockquote className="mt-3.5 line-clamp-5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-pretty text-bone/90">
            {review.text}
          </blockquote>

          <figcaption className="mt-4 flex items-center gap-3">
            {review.photoUrl ? (
              <Image
                src={review.photoUrl}
                alt=""
                width={40}
                height={40}
                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-bone/20"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-bone/10 text-sm font-medium text-bone/60"
              >
                {review.author.charAt(0).toUpperCase()}
              </span>
            )}

            <span className="min-w-0">
              {review.authorUrl ? (
                <a
                  href={review.authorUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                  className="block truncate text-sm font-medium text-bone hover:underline"
                >
                  {review.author}
                </a>
              ) : (
                <span className="block truncate text-sm font-medium text-bone">
                  {review.author}
                </span>
              )}
              <span className="mt-0.5 block font-mono text-[0.6875rem] tracking-tight text-bone/45">
                {review.relativeTime}
              </span>
            </span>

            {/* ---- which review, of how many ---- */}
            <span className="ml-auto flex shrink-0 items-center gap-1">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPos({ r: i, p: 0 })}
                  aria-label={`Show review ${i + 1} of ${count}`}
                  aria-current={i === pos.r}
                  data-cursor="link"
                  className="group grid h-6 cursor-pointer place-items-center px-0.5"
                >
                  <span
                    className={cn(
                      "block h-1 rounded-full transition-all duration-500 ease-[var(--ease-out-expo)]",
                      i === pos.r
                        ? "w-5 bg-brand-green"
                        : "w-1.5 bg-bone/25 group-hover:bg-bone/55",
                    )}
                  />
                </button>
              ))}
            </span>
          </figcaption>
        </figure>
      </div>

      {/* ---- the other photographs from this review ----
          Hung off the frame's left edge on wide screens, tucked inside it on
          narrow ones where an overhang would push the page sideways. */}
      {photos.length > 1 ? (
        <ul
          key={review.id}
          className={cn(
            "absolute top-5 left-4 z-10 flex flex-col gap-2.5 transition-opacity duration-700 sm:gap-3 lg:-left-8",
            ready ? "opacity-100 delay-[900ms]" : "opacity-0",
          )}
        >
          {photos.map((photo, i) => (
            <li
              key={photo.src}
              className="animate-(--animate-rise-in)"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <button
                type="button"
                onClick={() => setPos({ r: pos.r, p: i })}
                aria-label={`Show photograph ${i + 1} of ${photos.length}`}
                aria-current={i === pos.p}
                data-cursor="view"
                className={cn(
                  "group/thumb relative block size-16 cursor-pointer overflow-hidden rounded-2xl bg-ink-800 shadow-(--shadow-plate) ring-1 transition-all duration-500 ease-[var(--ease-out-expo)] sm:size-[4.5rem]",
                  i === pos.p
                    ? "ring-2 ring-brand-green"
                    : "ring-bone/15 hover:ring-bone/40",
                )}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  quality={60}
                  sizes="72px"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 bg-ink transition-opacity duration-500",
                    i === pos.p ? "opacity-0" : "opacity-45 group-hover/thumb:opacity-15",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Who is being rated, by whom, and the way to join them.
 *
 * The score means little without a name attached, so the mark sits with it —
 * and the ask to write one belongs next to the proof that others already did.
 */
export function HeroRatingBlock({ data }: { data: GooglePlaceReviews }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-3xl border border-bone/12 bg-ink-800/40 p-4 backdrop-blur-sm sm:pr-5">
      <a
        href={data.mapsUrl}
        target="_blank"
        rel="noreferrer"
        data-cursor="link"
        className="group flex items-center gap-3.5"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-bone/10 bg-bone/8 p-2.5">
          <BrandMark className="max-h-full max-w-full" labelled={false} />
        </span>

        <span>
          <span className="flex items-center gap-2">
            <Stars rating={data.rating} starClassName="size-3.5" emptyClassName="text-bone/15" />
            <span className="font-mono text-xs tracking-tight tabular-nums text-bone">
              {data.rating.toFixed(1)} / 5
            </span>
            <GoogleG className="size-3.5 shrink-0" />
          </span>
          <span className="mt-1 block text-xs text-bone/55 transition-colors duration-300 group-hover:text-bone/85">
            {data.total} Google review{data.total === 1 ? "" : "s"}
          </span>
        </span>
      </a>

      <a
        href={writeReviewUrl(data)}
        target="_blank"
        rel="noreferrer"
        data-cursor="link"
        className="group ml-auto inline-flex items-center gap-2 rounded-full border border-bone/25 px-4 py-2.5 text-xs font-medium text-bone transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-bone/70 hover:bg-bone hover:text-ink"
      >
        <PenLine aria-hidden="true" className="size-3.5" />
        Write a review
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </div>
  );
}
