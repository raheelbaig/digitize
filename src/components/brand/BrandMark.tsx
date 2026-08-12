import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The Digitize Are Us mark: three subtractive-primary circles in an
 * equilateral arrangement. Rebuilt as vector from the portfolio artwork —
 * geometry (r = 0.215, centres 0.307 apart) and all seven region colours were
 * sampled from the deck, so it is identical to the original but resolution
 * independent and transparent on any ground.
 */

const R = 30;
const CY_TOP = 30;
const CY_BOTTOM = 67.2;
const CX_LEFT = 30;
const CX_MID = 51.45;
const CX_RIGHT = 72.9;

const C = {
  yellow: "#f7e70a",
  magenta: "#e5057f",
  cyan: "#109bdb",
  red: "#da0507",
  green: "#1a8d02",
  indigo: "#190569",
  core: "#180205",
} as const;

export function BrandMark({
  className,
  title = "Digitize Are Us",
}: {
  className?: string;
  /** Pass null-ish only when an adjacent wordmark already names the brand. */
  title?: string | false;
}) {
  const uid = useId().replace(/:/g, "");
  const y = `y-${uid}`;
  const m = `m-${uid}`;

  return (
    <svg
      viewBox="0 0 103 97.2"
      className={cn("block", className)}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={y}>
          <circle cx={CX_MID} cy={CY_TOP} r={R} />
        </clipPath>
        <clipPath id={m}>
          <circle cx={CX_LEFT} cy={CY_BOTTOM} r={R} />
        </clipPath>
      </defs>

      {/* base primaries */}
      <circle cx={CX_MID} cy={CY_TOP} r={R} fill={C.yellow} />
      <circle cx={CX_LEFT} cy={CY_BOTTOM} r={R} fill={C.magenta} />
      <circle cx={CX_RIGHT} cy={CY_BOTTOM} r={R} fill={C.cyan} />

      {/* pairwise overlaps */}
      <g clipPath={`url(#${y})`}>
        <circle cx={CX_LEFT} cy={CY_BOTTOM} r={R} fill={C.red} />
        <circle cx={CX_RIGHT} cy={CY_BOTTOM} r={R} fill={C.green} />
      </g>
      <g clipPath={`url(#${m})`}>
        <circle cx={CX_RIGHT} cy={CY_BOTTOM} r={R} fill={C.indigo} />
      </g>

      {/* all three */}
      <g clipPath={`url(#${y})`}>
        <g clipPath={`url(#${m})`}>
          <circle cx={CX_RIGHT} cy={CY_BOTTOM} r={R} fill={C.core} />
        </g>
      </g>
    </svg>
  );
}

/** Mark plus wordmark, set in the site's own type so it works on dark. */
export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={cn("h-7 w-auto", markClassName)} title={false} />
      <span className="text-[0.8125rem] font-semibold leading-none tracking-[0.16em] uppercase">
        Digitize<span className="mx-[0.28em] opacity-45">Are</span>Us
      </span>
    </span>
  );
}
