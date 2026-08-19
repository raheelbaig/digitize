/**
 * Google reviews, served from a committed snapshot.
 *
 * The site makes **no Places API request** — not at runtime, not per visitor,
 * not on build. `npm run reviews:refresh` calls Google exactly once and writes
 * `src/data/generated/reviews.ts`; this module only reads that file.
 *
 * That is deliberate. Reviews on a marketing page change every few months at
 * most, so paying for a request per revalidation window bought nothing, and a
 * snapshot removes any possibility of an unexpected bill or of a Google
 * outage affecting the page. It also keeps the homepage fully static.
 *
 * The tradeoff is that reviews update when you run the command rather than on
 * their own. Google's policy expects cached content to be refreshed rather
 * than kept forever, so re-run it occasionally.
 */

import { GOOGLE_REVIEWS } from "@/data/generated/reviews";

/**
 * A photo from the listing, shown beside the review it belongs to.
 *
 * `credit` matters and must not be flattened away: "customer" means this
 * reviewer uploaded it themselves, "business" means it is our own work filling
 * out a card whose author posted no pictures. The caption says which.
 */
export type ReviewPhoto = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly credit: "customer" | "business";
  readonly author: string;
};

/** Google returns at most five. */
export type GoogleReview = {
  readonly id: string;
  readonly author: string;
  readonly authorUrl: string | null;
  readonly photoUrl: string | null;
  readonly rating: number;
  readonly relativeTime: string;
  readonly text: string;
  readonly photos: readonly ReviewPhoto[];
};

export type GooglePlaceReviews = {
  readonly name: string;
  /** Needed to build the write-a-review link. Absent in pre-2026 snapshots. */
  readonly placeId?: string | null;
  readonly rating: number;
  readonly total: number;
  readonly mapsUrl: string;
  readonly reviews: readonly GoogleReview[];
};

/**
 * Placeholder data for previewing the layout before a snapshot exists.
 *
 * Fenced to non-production and to an explicit opt-in flag, and the copy says
 * plainly that it is sample text — this must never be mistakable for a real
 * customer review on a live site.
 */
function mockReviews(): GooglePlaceReviews {
  const sample = (n: number, rating: number, when: string, text: string): GoogleReview => ({
    id: `mock-${n}`,
    author: `Sample Reviewer ${n}`,
    authorUrl: null,
    photoUrl: null,
    rating,
    relativeTime: when,
    text,
    photos: [],
  });

  return {
    name: "Sample Place",
    placeId: null,
    rating: 4.8,
    total: 24,
    mapsUrl: "https://maps.google.com/",
    reviews: [
      sample(1, 5, "2 months ago", "SAMPLE TEXT — placeholder copy used to preview the layout, not a real review. Roughly the length a typical Google review runs to."),
      sample(2, 5, "5 months ago", "SAMPLE TEXT — placeholder copy for layout preview only."),
      sample(3, 4, "8 months ago", "SAMPLE TEXT — placeholder copy used to check how a longer review wraps inside the card, and how two columns balance when the lengths differ."),
      sample(4, 5, "11 months ago", "SAMPLE TEXT — placeholder copy for layout preview only."),
    ],
  };
}

/**
 * Reads the snapshot. Async purely so callers need not change if this ever
 * goes back to fetching.
 */
export async function getGoogleReviews(): Promise<GooglePlaceReviews | null> {
  if (process.env.REVIEWS_MOCK === "1" && process.env.NODE_ENV !== "production") {
    return mockReviews();
  }
  return GOOGLE_REVIEWS;
}
