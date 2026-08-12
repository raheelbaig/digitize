"use client";

import { ADVANTAGES } from "@/data/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The commercial argument, on the light surface. Inverting here gives the page
 * its clearest scene change and makes the numbers read like a spec sheet.
 */
export function Benefits() {
  return (
    <section id="advantages" className="surface-bone relative py-24 sm:py-32">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionLabel index="07">Advantages</SectionLabel>
            <SplitText
              as="h2"
              lines={["Built around", "your deadlines."]}
              className="display mt-8 text-display-md"
            />
          </div>
          <Reveal className="lg:col-span-5 lg:col-start-8 lg:pt-3">
            <p className="max-w-md leading-relaxed text-ink/62">
              No minimums, hand inspection and a rush lane — the terms that decide
              whether a brand programme actually lands on time.
            </p>
          </Reveal>
        </div>

        <dl className="mt-16 grid gap-px border-t border-ink/12 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((item) => (
            <Reveal key={item.k} as="div" y={30}>
              <div className="group h-full border-b border-ink/12 py-8 pr-6 sm:py-10">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs tracking-[0.2em] text-ink/40">
                    {item.k}
                  </span>
                  {item.metric ? (
                    <span className="rounded-full bg-ink px-3 py-1 font-mono text-[0.6875rem] tracking-tight text-bone">
                      {item.metric}
                    </span>
                  ) : null}
                </div>
                <dt className="mt-5 text-2xl font-medium tracking-[-0.02em] text-ink">
                  {item.title}
                </dt>
                <dd className="mt-3 max-w-sm leading-relaxed text-ink/60">{item.body}</dd>
                <span
                  aria-hidden="true"
                  className="stitch-line mt-6 block h-px w-0 text-ink/50 transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-full"
                />
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
