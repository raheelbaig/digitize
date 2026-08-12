/**
 * Company facts. Every value here is taken verbatim from the client's
 * "DRU PATCHES" portfolio deck. Nothing is inferred or embellished — if the
 * deck does not state it, it does not belong in this file.
 */

export const SITE = {
  name: "Digitize Are Us",
  shortName: "DRU",
  domain: "digitizeareus.com",
  url: "https://www.digitizeareus.com",
  /** Deck cover, slide 1. */
  tagline: "We digitize your vision into perfection",
  positioning: "Your one stop shop",
} as const;

export const CONTACT = {
  phone: "+1 716 404-9260",
  /** E.164, for tel: links */
  phoneHref: "tel:+17164049260",
  email: "info@digitizeareus.com",
  emailHref: "mailto:info@digitizeareus.com",
  instagram: { handle: "digitizeareus", url: "https://instagram.com/digitizeareus" },
  facebook: { handle: "digitizeareus", url: "https://facebook.com/digitizeareus" },
} as const;

export const NAV_LINKS = [
  { label: "Craft", href: "#craft" },
  { label: "Products", href: "#products" },
  { label: "Process", href: "#process" },
  { label: "Advantages", href: "#advantages" },
  { label: "Contact", href: "#contact" },
] as const;

/**
 * Rewritten from the deck's "About Us" panel into editorial fragments.
 * Claims map 1:1 onto sentences in the source; none were added.
 */
export const ABOUT = {
  eyebrow: "About",
  heading: ["Precision", "is in the", "detail."],
  lede:
    "Digitize Are Us is a professional supplier of PVC patches, lanyards, keychains, metal products, hats and labels — plus custom solutions for promotional items and branding accessories.",
  columns: [
    {
      k: "Quality control",
      v: "Strict quality control and prompt customer support on every order.",
    },
    {
      k: "The team",
      v: "A skilled team ready to assist with your specific needs and requirements.",
    },
    {
      k: "Turnaround",
      v: "A streamlined process and fast turnaround time that keeps your business moving.",
    },
    {
      k: "Machinery",
      v: "Years of investment in advanced machinery for PVC production, metal crafting and embroidery.",
    },
  ],
  reach:
    "Our products are trusted and exported to clients worldwide — especially across the USA and European markets.",
} as const;

/** Deck slide 2 imagery: the real production floor. */
export const PROCESS_STEPS = [
  {
    n: "01",
    title: "Digitize",
    image: "manufacturing-01",
    body: "Your artwork is translated into stitch data and set on the machine head.",
  },
  {
    n: "02",
    title: "Produce",
    image: "manufacturing-05",
    body: "Embroidery, weaving, PVC moulding and metal crafting run on dedicated lines.",
  },
  {
    n: "03",
    title: "Weave",
    image: "manufacturing-02",
    body: "Woven labels and backing material come off the loom in continuous runs.",
  },
  {
    n: "04",
    title: "Finish",
    image: "manufacturing-03",
    body: "Cutting, bordering and backing are finished and squared by hand.",
  },
  {
    n: "05",
    title: "Inspect",
    image: "manufacturing-04",
    body: "Every order is hand inspected before it is packed and shipped.",
  },
] as const;

/** Deck slide 20, "Avail Advantages". Wording condensed, figures untouched. */
export const ADVANTAGES = [
  {
    k: "01",
    title: "No minimum order",
    body: "Competitive pricing and full service — even for an order of a single patch.",
    metric: null,
  },
  {
    k: "02",
    title: "Fast production",
    body: "Every standard order is ready to ship within 8–10 days, with rush orders for tight deadlines.",
    metric: "8–10 days",
  },
  {
    k: "03",
    title: "Super fast delivery",
    body: "5–7 business days for standard delivery. 3–4 business days for rush orders.",
    metric: "3–4 days rush",
  },
  {
    k: "04",
    title: "Quality guarantee",
    body: "We only use the best factories and hand inspect every order against our standard, and yours.",
    metric: null,
  },
  {
    k: "05",
    title: "Best service",
    body: "Seven day service. Creative, responsive, efficient, friendly, professional.",
    metric: "7 day service",
  },
  {
    k: "06",
    title: "Team work",
    body: "Our talented designers work with you to create pieces that reflect your group's interests or mission.",
    metric: null,
  },
] as const;

/**
 * Who the work is made for. Drawn from the deck's own sample products
 * (schools, clubs, crews, corporate, sports, military/service) — these are
 * audience descriptors, not claimed client relationships.
 */
export const AUDIENCES = [
  "Brands",
  "Teams",
  "Organizations",
  "Agencies",
  "Retail",
  "Promotional",
  "Uniform",
  "Corporate",
] as const;

export type Advantage = (typeof ADVANTAGES)[number];
export type ProcessStep = (typeof PROCESS_STEPS)[number];
