"use client";

import { ArrowUpRight, Phone } from "lucide-react";
import { CONTACT } from "@/data/site";
import { Magnetic } from "@/components/motion/Magnetic";
import { cn } from "@/lib/utils/cn";

type Variant = "solid" | "outline" | "bare";

/**
 * The site's single commercial action. There is no cart and no quote form —
 * every path ends at a phone call, so this control is deliberately the loudest
 * interactive element on the page.
 */
export function CallButton({
  variant = "solid",
  className,
  label = "Talk to our team",
  showNumber = true,
}: {
  variant?: Variant;
  className?: string;
  label?: string;
  showNumber?: boolean;
}) {
  return (
    <Magnetic>
      <a
        href={CONTACT.phoneHref}
        data-cursor="call"
        className={cn(
          "group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium",
          "transition-colors duration-300 ease-[var(--ease-out-expo)]",
          variant === "solid" && "bg-bone text-ink hover:bg-brand-green",
          variant === "outline" &&
            "border border-bone/25 text-bone hover:border-bone/70 hover:bg-bone hover:text-ink",
          variant === "bare" && "px-0 py-0 text-bone hover:text-brand-green",
          className,
        )}
      >
        <Phone
          aria-hidden="true"
          className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-12"
        />
        <span>{label}</span>
        {showNumber ? (
          <span className="hidden font-mono text-xs tracking-tight opacity-60 sm:inline">
            {CONTACT.phone}
          </span>
        ) : null}
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </Magnetic>
  );
}
