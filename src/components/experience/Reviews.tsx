import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getGoogleReviews } from "@/lib/reviews/google";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Stars } from "@/components/ui/Stars";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

/**
 * Google reviews, rendered in the site's own language rather than dropped in
 * as a third-party widget.
 *
 * This is a **server component on purpose** — the Places key is read during
 * render and never reaches the browser, and the whole section costs zero
 * client JavaScript and cannot shift layout the way an embedded widget does.
 *
 * It returns null when the API is not configured or the request fails, so the
 * page is complete with or without it.
 *
 * Google's display terms are honoured: text is shown verbatim, each review
 * carries its author's name and photo linking to their profile, the relative
 * publish time is kept, and the aggregate links back to the listing.
 */
export async function Reviews() {
  const data = await getGoogleReviews();
  if (!data) return null;

  const shown = data.reviews.slice(0, 4);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="surface-bone py-20 sm:py-28"
    >
      <div className="shell">
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
          {/* ---- the score ---- */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(var(--nav-h)+3rem)]">
              <SectionLabel index="09">Reviews</SectionLabel>

              <SplitText
                as="h2"
                id="reviews-heading"
                lines={["What buyers", "say."]}
                className="display mt-6 text-display-sm text-ink"
              />

              <Reveal delay={0.08}>
                <div className="mt-8 flex items-end gap-3">
                  <span className="display text-6xl text-ink tabular-nums">
                    {data.rating.toFixed(1)}
                  </span>
                  <span className="pb-2">
                    <Stars rating={data.rating} starClassName="size-5" />
                    <span className="mt-1.5 block font-mono text-xs tracking-tight text-ink/55">
                      {data.total} Google review{data.total === 1 ? "" : "s"}
                    </span>
                  </span>
                </div>

                {data.mapsUrl ? (
                  <a
                    href={data.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="link"
                    className="group mt-7 inline-flex items-center gap-2 border-b border-ink/25 pb-1.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink"
                  >
                    Read them on Google
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                ) : null}
              </Reveal>
            </div>
          </div>

          {/* ---- the reviews ---- */}
          <div className="lg:col-span-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {shown.map((review, i) => (
                <li key={review.id}>
                  <Reveal y={26} delay={(i % 2) * 0.06}>
                    <figure className="flex h-full flex-col rounded-xl border border-ink/10 bg-white p-6">
                      <div className="flex items-center gap-3">
                        {review.photoUrl ? (
                          <Image
                            src={review.photoUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/8 font-medium text-ink/50"
                          >
                            {review.author.charAt(0).toUpperCase()}
                          </span>
                        )}

                        <figcaption className="min-w-0">
                          {review.authorUrl ? (
                            <a
                              href={review.authorUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-medium text-ink hover:underline"
                            >
                              {review.author}
                            </a>
                          ) : (
                            <span className="block truncate text-sm font-medium text-ink">
                              {review.author}
                            </span>
                          )}
                          <span className="mt-0.5 block font-mono text-[0.6875rem] tracking-tight text-ink/45">
                            {review.relativeTime}
                          </span>
                        </figcaption>

                        <GoogleG className="ml-auto size-4 shrink-0" />
                      </div>

                      <Stars
                        rating={review.rating}
                        className="mt-4"
                        starClassName="size-3.5"
                      />

                      {/* verbatim, as Google's terms require */}
                      <blockquote className="mt-3 text-sm leading-relaxed text-ink/70">
                        {review.text}
                      </blockquote>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>

            <p className="mt-5 font-mono text-[0.6875rem] tracking-tight text-ink/40">
              Reviews sourced from Google. Shown unedited.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Google's four-colour G, for the required attribution. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="Google" role="img">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.4c4.1-3.8 6.6-9.4 6.6-15.7z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.5 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.6 29.9 2 24 2 15.5 2 8.1 6.9 4.4 14.1l7.1 5.5C13.3 14.6 18.2 10.8 24 10.8z"
      />
    </svg>
  );
}
