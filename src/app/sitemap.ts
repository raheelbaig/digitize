import type { MetadataRoute } from "next";
import { PRODUCT_CATEGORIES, categoryHref } from "@/data/products";
import { MERCH_BASE, SITE } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE.url}${MERCH_BASE}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...PRODUCT_CATEGORIES.map((c) => ({
      url: `${SITE.url}${categoryHref(c.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
