import type { Metadata } from "next";
import "./globals.scss";
import { Montserrat } from 'next/font/google'
import { PageTransition } from "@/components/layout/PageTransition/PageTransition";
import { GlassPointer } from "@/components/ui/GlassPointer/GlassPointer";
import { isIndexable, siteUrl } from "@/constants/seo";

const montserrat = Montserrat({
  subsets: ['latin']
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Larah Photo",
  description: "Photography portfolio website.",
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
      className={montserrat.className}
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
