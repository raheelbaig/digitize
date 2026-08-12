import { cn } from "@/lib/utils/cn";

/**
 * The small technical marker that opens every section. A short stitch rule
 * plus an index — the typographic echo of the embroidery language.
 */
export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="stitch-line h-px w-10 shrink-0 text-current opacity-40"
      />
      <span className="label-tech">
        {index ? <span className="mr-2 opacity-55">{index}</span> : null}
        {children}
      </span>
    </div>
  );
}
