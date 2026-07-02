This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## CMS / Backend

This project uses Sanity as the CMS because it gives editors a hosted admin UI,
image uploads, asset management, and a simple Content Lake API without running a
custom database server.

Managed content:

- Site settings: Instagram URL, email, phone, location, footer statement
- Home page: hero text/images, manifesto copy/images, section headings, closing image
- Work projects: slug, category, metadata, card image, hero image, gallery images
- Service packages: package title, description, features, price, CTA
- About page: title, portraits, notes, story paragraphs
- Contact page: title, cards, contact image, inquiry copy

Create or connect a Sanity project:

```bash
npx sanity@latest init
```

Use `/studio` as the Studio route when prompted. Then copy `.env.example` to
`.env.local` and fill in:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-01
```

Run the site and open the Studio:

```bash
npm run dev
```

- Website: [http://localhost:3000](http://localhost:3000)
- CMS admin: [http://localhost:3000/studio](http://localhost:3000/studio)

If Sanity environment variables are missing or the dataset has no documents yet,
the website falls back to the local content in `src/data/*` so the frontend still
builds and renders.

## Contact Form Email

The booking inquiry form sends email from the server through Resend. Add these
environment variables locally and in production:

```bash
RESEND_API_KEY=your_resend_api_key
CONTACT_FROM_EMAIL="Larah Photo <inquiries@your-verified-domain.com>"
CONTACT_TO_EMAIL=hello@example.com
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your_username
```

`CONTACT_FROM_EMAIL` must use a domain verified in Resend. `CONTACT_TO_EMAIL` is
the inbox that should receive session inquiries. `NEXT_PUBLIC_INSTAGRAM_URL`
controls the primary booking CTA used across the site.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
