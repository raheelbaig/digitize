import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_CATEGORIES, categoryBySlug, categoryHref } from "@/data/products";
import { IMAGES } from "@/data/generated/images";
import { SITE } from "@/data/site";
import { CategoryDetail } from "@/components/products/CategoryDetail";
import { FinalCTA } from "@/components/experience/FinalCTA";

/** Eight known families — all prerendered, nothing dynamic. */
export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/custom-merch/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return {};

  const title = `${category.title} — Custom ${category.title} Manufacturing`;
  const description = `${category.description} ${category.variants.length} constructions available: ${category.variants.join(", ")}.`;
  const hero = IMAGES[category.heroImage];

  return {
    title: category.title,
    description,
    alternates: { canonical: categoryHref(category.slug) },
    openGraph: {
      type: "article",
      url: `${SITE.url}${categoryHref(category.slug)}`,
      siteName: SITE.name,
      title,
      description,
      images: [{ url: hero.src, alt: `${category.title} by ${SITE.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [hero.src] },
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/custom-merch/[slug]">) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const hero = IMAGES[category.heroImage];

  /** Describes the family as an offering, using only deck-sourced facts. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProductCollection",
    name: category.title,
    description: category.description,
    url: `${SITE.url}${categoryHref(category.slug)}`,
    image: `${SITE.url}${hero.src}`,
    brand: { "@type": "Brand", name: SITE.name },
    hasVariant: category.variants.map((v) => ({ "@type": "Product", name: v })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryDetail category={category} />
      <FinalCTA />
    </>
  );
}
