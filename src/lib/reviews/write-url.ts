/**
 * The URL that opens Google's "write a review" dialog for a place.
 *
 * Kept apart from `google.ts` on purpose: that module imports the committed
 * snapshot, and this one is used by a client component. Importing it from
 * there would ship the whole review payload to the browser a second time, on
 * top of the copy React already serialises into the props.
 */

import type { GooglePlaceReviews } from "@/lib/reviews/google";

const WRITE_REVIEW = "https://search.google.com/local/writereview?placeid=";

/**
 * Google's own review composer, which lands on the listing and opens the
 * dialog in one hop — no hunting for the button on the Maps panel.
 *
 * Older snapshots predate the stored `placeId`, so it is recovered from a
 * review's resource name (`places/<id>/reviews/<id>`) when absent. With
 * neither, the listing itself is the honest fallback.
 */
export function writeReviewUrl(data: GooglePlaceReviews): string {
  const placeId =
    data.placeId ??
    data.reviews.find((r) => r.id.startsWith("places/"))?.id.split("/")[1] ??
    null;

  return placeId ? `${WRITE_REVIEW}${encodeURIComponent(placeId)}` : data.mapsUrl;
}
