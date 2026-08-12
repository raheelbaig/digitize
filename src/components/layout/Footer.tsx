import { ArrowUpRight } from "lucide-react";
import { SITE, CONTACT, NAV_LINKS } from "@/data/site";
import { BrandMark } from "@/components/brand/BrandMark";
import { SplitText } from "@/components/motion/SplitText";

/** Closing scene rather than a link dump: the promise, then the ways to reach us. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-bone/10 pt-20 pb-10">
      <div className="shell">
        <SplitText
          as="p"
          lines={["Built to be seen.", "Made to last."]}
          className="display text-display-md"
          lineClassName="text-bone"
        />

        <div className="mt-20 grid gap-12 border-t border-bone/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandMark className="h-10 w-auto" />
            <p className="mt-5 max-w-[15rem] text-sm leading-relaxed text-bone/55">
              {SITE.tagline}. {SITE.positioning} for custom manufacturing.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="label-tech">Sections</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-cursor="link"
                    className="text-sm text-bone/65 transition-colors hover:text-bone"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label-tech">Contact</p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              <li>
                <a
                  href={CONTACT.phoneHref}
                  data-cursor="call"
                  className="font-mono text-bone transition-colors hover:text-thread-yellow"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.emailHref}
                  data-cursor="link"
                  className="text-bone/65 transition-colors hover:text-bone"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.url}
                  data-cursor="link"
                  className="text-bone/65 transition-colors hover:text-bone"
                >
                  {SITE.domain}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="label-tech">Social</p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              {[CONTACT.instagram, CONTACT.facebook].map((social, i) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="link"
                    className="group inline-flex items-center gap-1.5 text-bone/65 transition-colors hover:text-bone"
                  >
                    {i === 0 ? "Instagram" : "Facebook"}
                    <span className="opacity-45">@{social.handle}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-bone/10 pt-6">
          <p className="label-tech">
            © {year} {SITE.name}
          </p>
          <p className="label-tech">All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
