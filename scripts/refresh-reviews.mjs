/**
 * Fetches Google reviews ONCE and writes them to a committed snapshot.
 *
 *   npm run reviews:refresh
 *
 * The site reads that snapshot, so it makes no Places API request at runtime,
 * on build, or per visitor — the only calls ever billed are the ones you make
 * by running this command. Reviewer avatars are downloaded too, so nothing
 * leaves the site at page-view time either.
 *
 * Google's Places policy expects cached content to be refreshed rather than
 * kept indefinitely, so run this occasionally. Monthly is ample, and twelve
 * calls a year sits far inside the free allowance.
 *
 * Photos are pulled too. The listing's photos carry an author attribution, so
 * the ones a reviewer uploaded can be handed to that reviewer's own card; the
 * rest are the business's own uploads and are captioned as such. See
 * `contributorId` for why the join is on the numeric id rather than the URI.
 */
import sharp from "sharp";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const API = "https://places.googleapis.com/v1";
const ENDPOINT = `${API}/places`;
const FIELDS = "displayName,rating,userRatingCount,googleMapsUri,reviews,photos";
const ROOT = path.resolve(import.meta.dirname, "..");
const AVATARS = path.join(ROOT, "public", "images", "reviews");
const PHOTOS = path.join(AVATARS, "photos");
const OUT = path.join(ROOT, "src", "data", "generated", "reviews.ts");

/** Widest we will ever display one. Bigger costs bytes for no visible gain. */
const PHOTO_W = 1400;
/** One main image plus a two-deep thumbnail stack. */
const PHOTOS_PER_REVIEW = 3;

/**
 * The stable half of a contributor URI.
 *
 * Google writes the same person two different ways depending on where they
 * turn up — `www.google.com/maps/contrib/<id>/reviews` on a review, and
 * `maps.google.com/maps/contrib/<id>` on a photo — so matching whole URIs
 * silently finds nothing. The numeric id is what actually identifies them.
 */
function contributorId(uri) {
  return uri?.match(/\/maps\/contrib\/(\d+)/)?.[1] ?? null;
}

try {
  process.loadEnvFile(".env.local");
} catch {
  /* fall back to the shell environment */
}

const key = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;

if (!key || !placeId) {
  console.error("Missing GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID in .env.local");
  process.exitCode = 1;
}

/** Human explanations for the failures this setup actually produces. */
const HINTS = {
  API_KEY_SERVICE_BLOCKED: [
    "The key's API restrictions do not include Places API (New).",
    "  Credentials -> click the key -> API restrictions -> tick 'Places API (New)'.",
    "  There are two similarly named entries; the legacy 'Places API' is a different one.",
  ],
  SERVICE_DISABLED: [
    "Places API (New) is not enabled on this project.",
    "  APIs & Services -> Library -> 'Places API (New)' -> Enable.",
  ],
  API_KEY_HTTP_REFERRER_BLOCKED: [
    "The key is restricted to HTTP referrers, but this call is server-side and sends none.",
    "  Set Application restrictions to None, or to IP addresses.",
  ],
  REQUEST_DENIED: ["Billing may not be enabled on the project."],
};

const BY_STATUS = {
  400: ["Malformed Place ID — it must be the ChIJ… string, not a cid number."],
  404: ["No place with that ID. Re-check it in the Place ID Finder."],
  429: ["Daily quota exceeded."],
};

if (key && placeId) {
  console.log(`place id : ${placeId}`);
  console.log(`key      : ${key.slice(0, 8)}…${key.slice(-4)}`);
  console.log("");
  console.log("making exactly one Places API request…");
  console.log("");

  const res = await fetch(`${ENDPOINT}/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
  });
  const body = await res.text();

  if (!res.ok) {
    const reason = body.match(/"reason": ?"([A-Z_]+)"/)?.[1] ?? "";
    console.error(`HTTP ${res.status}  ${reason}`);
    console.error("");
    for (const line of HINTS[reason] ?? BY_STATUS[res.status] ?? [body]) {
      console.error(line);
    }
    // Set the code rather than exiting hard: process.exit() while fetch
    // handles are still open trips a libuv assertion on Windows and buries
    // the message we actually want the reader to see.
    process.exitCode = 1;
  } else {
    const data = JSON.parse(body);

    console.log(`name     : ${data.displayName?.text ?? "(none)"}`);
    console.log(`rating   : ${data.rating ?? "(none)"}`);
    console.log(
      `reviews  : ${data.userRatingCount ?? 0} total, ${data.reviews?.length ?? 0} returned`,
    );
    console.log("");

    // --- avatars and photos, stored locally so the page needs nothing
    //     from Google at view time ---
    await rm(AVATARS, { recursive: true, force: true });
    await mkdir(AVATARS, { recursive: true });
    await mkdir(PHOTOS, { recursive: true });

    /** Every listing photo, bucketed by the contributor who uploaded it. */
    const byContributor = new Map();
    for (const photo of data.photos ?? []) {
      const attribution = photo.authorAttributions?.[0];
      const id = contributorId(attribution?.uri);
      if (!id) continue;
      if (!byContributor.has(id)) byContributor.set(id, []);
      byContributor.get(id).push({ photo, author: attribution?.displayName ?? "" });
    }

    // The business uploads under its own contributor account, which the API
    // does not flag — it is recognisable only by the name matching the place.
    const placeName = (data.displayName?.text ?? "").trim().toLowerCase();
    const ours = [];
    for (const entries of byContributor.values()) {
      if (entries[0].author.trim().toLowerCase() === placeName) ours.push(...entries);
    }

    let saved = 0;
    /** photo.name -> saved record, so no photo is ever fetched (or paid for) twice. */
    const downloaded = new Map();

    /** Downloads one photo at display size. Each miss is a billed request. */
    async function savePhoto({ photo, author }, credit) {
      const hit = downloaded.get(photo.name);
      if (hit) return hit;

      try {
        const res = await fetch(`${API}/${photo.name}/media?maxWidthPx=${PHOTO_W}`, {
          headers: { "X-Goog-Api-Key": key },
        });
        if (!res.ok) return null;

        saved += 1;
        const file = `photo-${String(saved).padStart(2, "0")}.webp`;
        const info = await sharp(Buffer.from(await res.arrayBuffer()))
          // Cap the long edge, not just the width: reviewers shoot portrait,
          // and a width-only cap leaves a 3024x4032 phone photo taller than it
          // is wide and several times the weight of everything around it.
          .resize({ width: PHOTO_W, height: PHOTO_W, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(PHOTOS, file));

        const record = {
          src: `/images/reviews/photos/${file}`,
          width: info.width,
          height: info.height,
          credit,
          author,
        };
        downloaded.set(photo.name, record);
        return record;
      } catch {
        return null; // a card without photos still renders
      }
    }

    // Business photos are dealt round-robin with wraparound. Dealing them
    // strictly in order would hand the whole pool to the first review and leave
    // the last ones bare; only one card is on screen at a time, so a picture
    // reappearing on a later card costs nothing.
    let nextOurs = 0;

    const reviews = [];
    let n = 0;

    for (const r of data.reviews ?? []) {
      const text = (r.text?.text ?? r.originalText?.text ?? "").trim();
      if (!text) continue;
      n += 1;

      let photo = null;
      const remote = r.authorAttribution?.photoUri;
      if (remote) {
        try {
          const img = await fetch(remote);
          if (img.ok) {
            const buf = Buffer.from(await img.arrayBuffer());
            const file = `reviewer-${String(n).padStart(2, "0")}.webp`;
            await sharp(buf)
              .resize(96, 96, { fit: "cover" })
              .webp({ quality: 88 })
              .toFile(path.join(AVATARS, file));
            photo = `/images/reviews/${file}`;
          }
        } catch {
          /* avatars are optional; the initial-letter fallback covers it */
        }
      }

      // This reviewer's own uploads first; the business's own work fills the
      // rest. Photos by customers whose review Google did not return are left
      // out on purpose — showing one beside somebody else's quote would read
      // as that person's photo.
      const mine = byContributor.get(contributorId(r.authorAttribution?.uri)) ?? [];
      const photos = [];

      for (const entry of mine.slice(0, PHOTOS_PER_REVIEW)) {
        const record = await savePhoto(entry, "customer");
        if (record) photos.push(record);
      }
      for (let i = 0; photos.length < PHOTOS_PER_REVIEW && i < ours.length; i += 1) {
        const record = await savePhoto(ours[nextOurs++ % ours.length], "business");
        if (record) photos.push(record);
      }

      reviews.push({
        id: r.name ?? `review-${n}`,
        author: r.authorAttribution?.displayName?.trim() || "A Google user",
        authorUrl: r.authorAttribution?.uri ?? null,
        photoUrl: photo,
        rating: typeof r.rating === "number" ? r.rating : 0,
        relativeTime: r.relativePublishTimeDescription ?? "",
        text, // verbatim, as Google's terms require
        photos,
      });

      const stars = "*".repeat(r.rating ?? 0).padEnd(5);
      const preview = text.replace(/\s+/g, " ").slice(0, 60);
      const own = photos.filter((x) => x.credit === "customer").length;
      console.log(
        `  ${stars} ${reviews.at(-1).author} — ${preview}…` +
          `  [${photos.length} photos, ${own} theirs]`,
      );
    }

    const snapshot =
      typeof data.rating === "number" && data.userRatingCount
        ? {
            name: data.displayName?.text ?? "",
            placeId,
            rating: data.rating,
            total: data.userRatingCount,
            mapsUrl: data.googleMapsUri ?? "",
            reviews,
          }
        : null;

    const header = [
      "// GENERATED by scripts/refresh-reviews.mjs -- do not edit by hand.",
      `// Snapshot taken ${new Date().toISOString().slice(0, 10)}. Re-run: npm run reviews:refresh`,
      'import type { GooglePlaceReviews } from "@/lib/reviews/google";',
      "",
      `export const GOOGLE_REVIEWS: GooglePlaceReviews | null = ${JSON.stringify(snapshot, null, 2)};`,
      "",
    ].join("\n");

    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, header);

    console.log("");
    console.log(`photos   : ${saved} downloaded to ${path.relative(ROOT, PHOTOS)}`);
    console.log(`wrote ${path.relative(ROOT, OUT)}`);
    console.log(
      snapshot
        ? "The site renders these with no further API calls."
        : "No rating yet — the section stays hidden.",
    );
  }
}
