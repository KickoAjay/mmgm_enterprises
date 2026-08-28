import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const siteName = "MMGM Enterprises";
const defaultDescription =
  "Discover timeless sarees curated for every occasion at MMGM Enterprises.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Premium Sarees for Every Occasion`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} | Premium Sarees for Every Occasion`,
    description: defaultDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: `${siteName} | Premium Sarees for Every Occasion`,
    description: defaultDescription,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
