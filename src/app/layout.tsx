import type { Metadata } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.scss";
import { Montserrat } from 'next/font/google'

config.autoAddCss = false;

const montserrat = Montserrat({
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: "Larah Photo",
  description: "Photography portfolio website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.className}>
      <body>{children}</body>
    </html>
  );
}
