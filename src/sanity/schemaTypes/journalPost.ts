import { defineArrayMember, defineField, defineType } from "sanity";
// Relative rather than `@/`: schema files are also loaded by the Sanity CLI
// (sanity.cli.ts), whose bundler does not read the tsconfig path alias.
import { JOURNAL_CATEGORIES } from "../../constants/journalCategories";
import {
  formatJournalDate,
  isIsoDate,
  isLive,
  todayInStudioTimeZone,
} from "../../utils/journalDate";
import {
  EMBED_REJECTION_MESSAGE,
  parseEmbedUrl,
} from "../../utils/journalEmbed";
import { imageField } from "./shared";

/**
 * A journal article (spec 013). Field rules trace to
 * specs/013-journal-section/data-model.md; what blocks a publish and what
 * merely advises is contracts/content-model.md.
 */

/** `https://`, `http://`, `mailto:`, or a path on this site. */
function isValidHref(value: string) {
  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    return ["https:", "http:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * The preview's subtitle. A future date is flagged as scheduled so it never
 * reads as a failed publish (FR-007b). A date that has arrived is shown plain,
 * not as "Live": the preview cannot see whether the document is published,
 * and Sanity's own draft/published badge already says that.
 */
function previewDate(publishedAt: unknown) {
  if (typeof publishedAt !== "string" || !isIsoDate(publishedAt)) {
    return "No date set";
  }

  const date = formatJournalDate(publishedAt);

  return isLive(publishedAt, todayInStudioTimeZone())
    ? date
    : `Scheduled · ${date}`;
}

const bodyImage = defineArrayMember({
  name: "bodyImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      description: "Describes the photograph for people who can't see it.",
      type: "string",
      validation: (rule) => rule.required().error("Alt text is required."),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      description:
        "Optional, shown under the photograph to every reader. It does not " +
        "replace the alt text.",
      type: "string",
    }),
  ],
});

const embed = defineArrayMember({
  name: "embed",
  title: "Map or video",
  type: "object",
  fields: [
    defineField({
      name: "url",
      title: "Link",
      description:
        "A Google Maps embed link (Share → Embed a map), or a YouTube or " +
        "Vimeo link.",
      type: "url",
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            !value || parseEmbedUrl(value) ? true : EMBED_REJECTION_MESSAGE,
          ),
    }),
    defineField({
      name: "title",
      title: "Description",
      description:
        'What this shows, e.g. "Map of Springbank Park". Read aloud to ' +
        "screen reader users in place of the map or video.",
      type: "string",
      validation: (rule) =>
        rule.required().error("Describe what this embed shows."),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
});

export const journalPost = defineType({
  name: "journalPost",
  title: "Journal post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "The post's address: /journal/<slug>. Changing it on a published " +
        "post breaks every existing link to it — nothing redirects the old " +
        "address.",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    imageField("coverImage", "Cover image"),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      description:
        "A short summary, shown on the journal page and in search results.",
      type: "text",
      rows: 3,
      validation: (rule) => [
        rule.required(),
        rule
          .max(200)
          .warning("Search results cut summaries off around 200 characters."),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: "block",
          // No H1: the post title is the page's only top-level heading, and
          // this is where that is enforced rather than hoped for.
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Heading", value: "h2" },
            { title: "Subheading", value: "h3" },
            { title: "Minor heading", value: "h4" },
            { title: "Pull quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bulleted", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              defineArrayMember({
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Link",
                    description:
                      "A full address (https://…), an email (mailto:…), or " +
                      "a page on this site (/work).",
                    type: "string",
                    validation: (rule) =>
                      rule
                        .required()
                        .custom((value) =>
                          !value || isValidHref(value)
                            ? true
                            : "Enter a valid link.",
                        ),
                  }),
                ],
              }),
            ],
          },
        }),
        bodyImage,
        embed,
      ],
    }),
    defineField({
      name: "location",
      title: "Location",
      description: 'Venue and city, e.g. "Springbank Park, London, Ontario".',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: JOURNAL_CATEGORIES.map((category) => ({
          title: category,
          value: category,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      description:
        "A future date schedules the post: it stays off the site until that " +
        "day, then appears on its own.",
      type: "date",
      initialValue: () => todayInStudioTimeZone(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seoTitle",
      title: "Search title",
      description: "Optional. Replaces the title in search results.",
      type: "string",
      validation: (rule) =>
        rule
          .max(60)
          .warning("Search results cut titles off around 60 characters."),
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      description: "Optional. Replaces the excerpt in search results.",
      type: "text",
      rows: 3,
      validation: (rule) =>
        rule
          .max(160)
          .warning(
            "Search results cut descriptions off around 160 characters.",
          ),
    }),
  ],
  preview: {
    select: {
      title: "title",
      publishedAt: "publishedAt",
      media: "coverImage",
    },
    prepare: ({ title, publishedAt, media }) => ({
      title,
      subtitle: previewDate(publishedAt),
      media,
    }),
  },
});
