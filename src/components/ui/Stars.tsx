import { cn } from "@/lib/utils/cn";

/**
 * A star rating, drawn as one SVG with a partial-width overlay so halves land
 * exactly rather than being rounded to the nearest whole star.
 *
 * Amber is deliberate and is not a brand colour: gold stars are the universal
 * convention for a rating, the same way red means error. Rendering these in
 * the brand's blue or green would read as decoration rather than a score.
 */
const AMBER = "#f3a712";

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-full", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 17.3 6.2 20.6l1.5-6.6L2.6 9.6l6.7-.6L12 2.9l2.7 6.1 6.7.6-5.1 4.4 1.5 6.6z"
      />
    </svg>
  );
}

export function Stars({
  rating,
  count = 5,
  className,
  starClassName = "size-4",
}: {
  rating: number;
  count?: number;
  className?: string;
  starClassName?: string;
}) {
  const pct = Math.max(0, Math.min(1, rating / count)) * 100;

  return (
    <span
      className={cn("relative inline-flex", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of ${count} stars`}
    >
      {/* empty track */}
      <span className="inline-flex gap-0.5 text-ink/15">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={starClassName}>
            <Star />
          </span>
        ))}
      </span>
      {/* filled overlay, clipped to the exact score */}
      <span
        className="pointer-events-none absolute inset-0 inline-flex gap-0.5 overflow-hidden"
        style={{ width: `${pct}%`, color: AMBER }}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={cn(starClassName, "shrink-0")}>
            <Star />
          </span>
        ))}
      </span>
    </span>
  );
}
