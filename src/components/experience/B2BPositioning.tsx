"use client";

import { AUDIENCES } from "@/data/site";
import { Marquee } from "@/components/motion/Marquee";
import { SplitText } from "@/components/motion/SplitText";
import { SectionLabel } from "@/components/ui/SectionLabel";

/**
 * Who this is for, said with typography rather than a row of icons. The two
 * bands drift in opposite directions so the words read as a moving system.
 */
export function B2BPositioning() {
  return (
    <section className="surface-bone overflow-hidden pb-24 sm:pb-32">
      <div className="shell">
        <SectionLabel index="08">Who we make for</SectionLabel>
        <SplitText
          as="h2"
          lines={["Made for brands that", "care about the details."]}
          className="display mt-8 max-w-4xl text-display-md"
        />
      </div>

      <div className="mt-16 flex flex-col gap-4">
        <Marquee speed={46}>
          {AUDIENCES.map((word) => (
            <span key={word} className="flex items-center">
              <span className="display px-6 text-[clamp(2.5rem,7vw,6rem)] text-ink/85">
                {word}
              </span>
              <span aria-hidden="true" className="size-2 rounded-full bg-brand-green-deep" />
            </span>
          ))}
        </Marquee>

        <Marquee speed={54} reverse>
          {AUDIENCES.map((word) => (
            <span key={word} className="flex items-center">
              <span className="display px-6 text-[clamp(2.5rem,7vw,6rem)] text-ink/18">
                {word}
              </span>
              <span aria-hidden="true" className="size-2 rounded-full bg-brand-blue" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* The marquee is decorative; state the same list once for assistive tech. */}
      <p className="sr-only">
        We manufacture for {AUDIENCES.join(", ")}.
      </p>
    </section>
  );
}
