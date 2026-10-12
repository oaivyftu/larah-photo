import { defineArrayMember, defineField, defineType } from "sanity";
// Relative rather than `@/`: schema files are also loaded by the Sanity CLI
// (sanity.cli.ts), whose bundler does not read the tsconfig path alias.
import { suggestLandingSlug } from "../../utils/landingSlug";
import {
  answerMeetsMinimum,
  categoryIsUnique,
  categoryMatchesProject,
  documentMeetsTotal,
  faqCountIsEnough,
  introductionMeetsMinimum,
  packageIsUnique,
  publishedNeedsApprovalAndNoMarkers,
  sectionBodyMeetsMinimum,
  sectionCountIsEnough,
  slugChangeWarning,
  slugIsValid,
} from "./landingValidation";

/**
 * One service landing page (spec 014). Field rules trace to
 * specs/014-service-landing-pages/data-model.md; what blocks a publish and
 * what merely advises is contracts/content-model.md. The blocking and
 * advisory validators are layered on in landingValidation.ts.
 */

const landingSection = defineArrayMember({
  name: "landingSection",
  title: "Section",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      description: "One paragraph per entry.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom(sectionBodyMeetsMinimum),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
  },
});

const landingFaq = defineArrayMember({
  name: "landingFaq",
  title: "Question",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      description: "Plain text.",
      type: "text",
      rows: 4,
      validation: (rule) => [rule.required(), rule.custom(answerMeetsMinimum)],
    }),
  ],
  preview: {
    select: { title: "question", subtitle: "answer" },
  },
});

export const serviceLandingPage = defineType({
  name: "serviceLandingPage",
  title: "Service landing page",
  type: "document",
  fields: [
    defineField({
      name: "published",
      title: "Published",
      description:
        "Off until you switch it on. A page that is off is invisible to " +
        "visitors, the sitemap and search engines, and nothing links to it. " +
        "Needs the approval box below and no [[CONFIRM …]] left in the text.",
      type: "boolean",
      initialValue: false,
      validation: (rule) => rule.custom(publishedNeedsApprovalAndNoMarkers),
    }),
    defineField({
      name: "approvedAgainstBrief",
      title: "Approved against the brief",
      description:
        "Tick when you have checked every statement on this page — prices, " +
        "times, policies, places — against the content brief and the " +
        "studio's real practice.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "package",
      title: "Service package",
      description: "The package this page sells. One page per package.",
      type: "reference",
      // Strong, so Sanity refuses to publish a page whose package is
      // unpublished and refuses to delete a package a page still uses.
      to: [{ type: "servicePackage" }],
      validation: (rule) => [rule.required(), rule.custom(packageIsUnique)],
    }),
    defineField({
      name: "serviceName",
      title: "Service name",
      description:
        "The words clients search for, e.g. Engagement. Used in the " +
        "heading. Not the package title.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alternateName",
      title: "Alternate name",
      description:
        "Optional. Another name clients search for, e.g. Pre-wedding. " +
        "Shown in the heading and declared in the page's search data.",
      type: "string",
    }),
    defineField({
      name: "category",
      title: "Project category",
      description:
        "The work category this page shows, e.g. Engagement. Matched to " +
        "work projects ignoring capitals and spacing. One page per category.",
      type: "string",
      validation: (rule) => [
        rule.required(),
        rule.custom(categoryIsUnique).error(),
        rule.custom(categoryMatchesProject).warning(),
      ],
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "The page's address: /<slug>. Changing it on a published page " +
        "breaks every existing link to it — nothing redirects the old " +
        "address.",
      type: "slug",
      options: {
        source: (document) =>
          suggestLandingSlug(String(document["serviceName"] ?? "")),
      },
      validation: (rule) => [
        rule.required(),
        rule.custom(slugIsValid).error(),
        rule.custom(slugChangeWarning).warning(),
      ],
    }),
    defineField({
      name: "introduction",
      title: "Introduction",
      description:
        "Opens the page. At least 50 words. One paragraph per entry.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom(introductionMeetsMinimum),
      ],
    }),
    defineField({
      name: "sections",
      title: "Sections",
      description:
        "What is particular to this service: what a session involves, " +
        "where in London it happens, how to prepare, what happens after. " +
        "At least 3, each body at least 60 words.",
      type: "array",
      of: [landingSection],
      // Custom rather than `rule.min`, so the message can say how many there
      // are (contracts/content-model.md).
      validation: (rule) => [
        rule.required(),
        rule.custom(sectionCountIsEnough),
      ],
    }),
    defineField({
      name: "faqs",
      title: "Frequently asked questions",
      description:
        "At least 5. Each answer at least 30 words, plain text. These are " +
        "also sent to search engines as the page's question-and-answer data.",
      type: "array",
      of: [landingFaq],
      validation: (rule) => [rule.required(), rule.custom(faqCountIsEnough)],
    }),
    defineField({
      name: "seoTitle",
      title: "Search title",
      description:
        "The title shown in search results and when the link is shared. " +
        "Search results cut titles off around 60 characters.",
      type: "string",
      validation: (rule) => [
        rule.required(),
        rule
          .max(60)
          .warning("Search results cut titles off around 60 characters."),
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      description:
        "Shown in search results. Search results cut descriptions off " +
        "around 160 characters.",
      type: "text",
      rows: 3,
      validation: (rule) => [
        rule.required(),
        rule
          .max(160)
          .warning(
            "Search results cut descriptions off around 160 characters.",
          ),
      ],
    }),
  ],
  // The total spans fields no single field rule can see, so it is the one
  // document-level rule; it reports at the introduction.
  validation: (rule) =>
    rule.custom((document) =>
      documentMeetsTotal(document as Parameters<typeof documentMeetsTotal>[0]),
    ),
  preview: {
    select: { title: "serviceName", published: "published" },
    // The preview cannot see Sanity's own draft/published state (the Studio's
    // badge already shows it), so the subtitle claims only what it can: what
    // the switch will do once the document is published.
    prepare: ({ title, published }) => ({
      title,
      subtitle: published ? "Live once published" : "Held back",
    }),
  },
});
