import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be told about the theme's custom font sizes.
 *
 * Without this it cannot tell `text-display-sm` from a colour, so in a list
 * like `text-display-sm text-ink` it treats the two as the same property,
 * keeps the last one and silently drops the size — headings then render at
 * 16px with no error anywhere. Registering them as `font-size` keeps size and
 * colour independent.
 *
 * Any new `--text-*` token in globals.css belongs in this list too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["display-xl", "display-lg", "display-md", "display-sm", "lede"],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
