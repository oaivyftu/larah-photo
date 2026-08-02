import type { Metadata } from "next";
import "./globals.scss";
import { Montserrat } from 'next/font/google'
import { PageTransition } from "@/components/layout/PageTransition/PageTransition";
import { GlassPointer } from "@/components/ui/GlassPointer/GlassPointer";
import {
  isIndexable,
  siteDescription,
  siteName,
  siteUrl,
} from "@/constants/seo";

// Exposed as a CSS variable so `--font-sans` can point at the hashed family
// `next/font` generates — naming "Montserrat" directly resolves to nothing.
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Each route sets its own `title`; the template appends the brand so every
  // page gets a distinct, self-describing document title (WCAG 2.4.2).
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  // Inherited by every route that does not set its own; `pageMetadata` fills
  // in the per-page title, description and canonical on top of these.
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    url: "/",
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
  // Safari turns bare digits in the footer's phone number into tel: links of
  // its own, which rewrites the markup crawlers see.
  formatDetection: { telephone: false, address: false, email: false },
  robots: isIndexable
    ? undefined
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true },
      },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={montserrat.variable}
      data-scroll-behavior="smooth"
    >
      <body>
        {children}
        {modal}
        <PageTransition />
        <GlassPointer />
      </body>
    </html>
  );
}
