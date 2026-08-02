/**
 * Root layout for the Sanity Studio, deliberately separate from the site's own
 * root layout under `(site)`. Studio ships a complete design system of its own
 * and styles nothing on `<html>`/`<body>`, so anything the site puts there —
 * the `globals.scss` reset, the Montserrat variable, the paper/ink colours —
 * lands straight inside the editor. Keeping this tree free of those imports is
 * what stops the leak; nothing here should grow a global stylesheet.
 */
export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
