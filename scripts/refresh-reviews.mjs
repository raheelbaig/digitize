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
 */
import sharp from "sharp";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = "https://places.googleapis.com/v1/places";
const FIELDS = "displayName,rating,userRatingCount,googleMapsUri,reviews";
const ROOT = path.resolve(import.meta.dirname, "..");
const AVATARS = path.join(ROOT, "public", "images", "reviews");
const OUT = path.join(ROOT, "src", "data", "generated", "reviews.ts");

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

    // --- avatars, stored locally so the page needs nothing from Google ---
    await rm(AVATARS, { recursive: true, force: true });
    await mkdir(AVATARS, { recursive: true });

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

      reviews.push({
        id: r.name ?? `review-${n}`,
        author: r.authorAttribution?.displayName?.trim() || "A Google user",
        authorUrl: r.authorAttribution?.uri ?? null,
        photoUrl: photo,
        rating: typeof r.rating === "number" ? r.rating : 0,
        relativeTime: r.relativePublishTimeDescription ?? "",
        text, // verbatim, as Google's terms require
      });

      const stars = "*".repeat(r.rating ?? 0).padEnd(5);
      const preview = text.replace(/\s+/g, " ").slice(0, 60);
      console.log(`  ${stars} ${reviews.at(-1).author} — ${preview}…`);
    }

    const snapshot =
      typeof data.rating === "number" && data.userRatingCount
        ? {
            name: data.displayName?.text ?? "",
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
    console.log(`wrote ${path.relative(ROOT, OUT)}`);
    console.log(
      snapshot
        ? "The site renders these with no further API calls."
        : "No rating yet — the section stays hidden.",
    );
  }
}
