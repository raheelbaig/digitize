import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SITE, CONTACT } from "@/data/site";
import { IntroProvider } from "@/components/providers/Intro";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingCallButton } from "@/components/layout/FloatingCallButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Digitize Are Us manufactures custom patches, lanyards, keychains, PVC and metal products, headwear and labels for brands, teams and organizations. No minimum order, rush production, worldwide shipping.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Digitize Are Us — Premium Custom Embroidery & Promotional Products",
    template: "%s · Digitize Are Us",
  },
  description,
  applicationName: SITE.name,
  keywords: [
    "custom patches",
    "embroidery patches",
    "PVC patches",
    "woven labels",
    "custom lanyards",
    "custom keychains",
    "lapel pins",
    "promotional products",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: "Digitize Are Us — Premium Custom Embroidery & Promotional Products",
    description,
    images: [{ url: "/images/patches/patches-01.webp", width: 1200, height: 630, alt: "Finished embroidered patches by Digitize Are Us" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digitize Are Us — Premium Custom Embroidery & Promotional Products",
    description,
    images: ["/images/patches/patches-01.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08080c",
  colorScheme: "dark",
};

/** Organization + contact data for rich results. Facts only from the deck. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description,
  telephone: CONTACT.phone,
  email: CONTACT.email,
  sameAs: [CONTACT.instagram.url, CONTACT.facebook.url],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "sales",
      availableLanguage: "English",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-bone focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>

        <IntroProvider>
          <SmoothScroll>
            <Cursor />
            <Navbar />
            <main id="main">{children}</main>
            <FloatingCallButton />
          </SmoothScroll>
        </IntroProvider>
      </body>
    </html>
  );
}
