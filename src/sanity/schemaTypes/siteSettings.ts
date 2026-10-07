import { defineArrayMember, defineField, defineType } from "sanity";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Site name",
      type: "string",
      initialValue: "Larah Photo",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "googleBusinessUrl",
      title: "Google Business Profile URL",
      description:
        "Link to the studio's Google Business Profile or Maps listing. " +
        "Never shown on the site — it tells Google that the listing and " +
        "this site are the same business, so reviews and the map card " +
        "attach to the right entity.",
      type: "url",
    }),
    defineField({
      name: "email",
      title: "Business email",
      type: "email",
    }),
    defineField({
      name: "phone",
      title: "Business phone",
      type: "string",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "priceCurrency",
      title: "Price currency",
      description:
        "Three-letter ISO code for the currency the package prices are in " +
        '(e.g. "CAD", "USD"). The site renders prices with a bare "$", so ' +
        "this is what tells search engines which dollar is meant.",
      type: "string",
      initialValue: "CAD",
      validation: (rule) =>
        rule
          .uppercase()
          .length(3)
          .error("Use a three-letter ISO 4217 code, e.g. CAD."),
    }),
    defineField({
      name: "postalAddress",
      title: "Postal address",
      description:
        "Optional, and never shown on the site. Google only treats the studio " +
        "as a local business — the listing with a map, hours and directions — " +
        "when it can read a real street address, so filling this in is what " +
        "turns on local search results.",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "streetAddress", title: "Street", type: "string" }),
        defineField({ name: "locality", title: "City", type: "string" }),
        defineField({
          name: "region",
          title: "State / region",
          type: "string",
        }),
        defineField({
          name: "postalCode",
          title: "Postal code",
          type: "string",
        }),
        defineField({
          name: "country",
          title: "Country code",
          description: 'Two letters, e.g. "VN" or "US".',
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "businessImage",
      title: "Business photo",
      description:
        "Never shown on the site. One photograph that represents the studio, " +
        "sent to Google as the business's own image for local search results. " +
        "Landscape works best.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "geo",
      title: "Map coordinates",
      description:
        "Optional, and never shown on the site. Pins the studio on the map " +
        "Google builds from this page. Right-click the studio in Google Maps " +
        "and copy the two numbers it shows.",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "latitude",
          title: "Latitude",
          type: "number",
          validation: (rule) => rule.min(-90).max(90),
        }),
        defineField({
          name: "longitude",
          title: "Longitude",
          type: "number",
          validation: (rule) => rule.min(-180).max(180),
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          const hasLatitude = typeof value?.latitude === "number";
          const hasLongitude = typeof value?.longitude === "number";

          return hasLatitude === hasLongitude
            ? true
            : "Fill in both latitude and longitude, or neither.";
        }),
    }),
    defineField({
      name: "openingHours",
      title: "Opening hours",
      description:
        "Optional, and never shown on the site. Keep these identical to the " +
        "hours on the Google Business Profile — two sources that disagree is " +
        "worse than one. Add one row per set of days; a day with no row " +
        "reads as closed.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "days",
              title: "Days",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
              options: { list: DAYS_OF_WEEK, layout: "grid" },
              validation: (rule) => rule.required().min(1).unique(),
            }),
            defineField({
              name: "opens",
              title: "Opens",
              description: '24-hour time, e.g. "09:30".',
              type: "string",
              validation: (rule) =>
                rule
                  .required()
                  .regex(TIME_OF_DAY, { name: "24-hour time (HH:MM)" }),
            }),
            defineField({
              name: "closes",
              title: "Closes",
              description:
                '24-hour time, e.g. "17:00". Must be later the same day.',
              type: "string",
              validation: (rule) =>
                rule
                  .required()
                  .regex(TIME_OF_DAY, { name: "24-hour time (HH:MM)" }),
            }),
          ],
          validation: (rule) =>
            rule.custom((value) =>
              value?.opens && value?.closes && value.closes <= value.opens
                ? "Closing time must be later than opening time."
                : true,
            ),
          preview: {
            select: { days: "days", opens: "opens", closes: "closes" },
            prepare: ({ days, opens, closes }) => ({
              title: Array.isArray(days) ? days.join(", ") : "No days",
              subtitle: `${opens ?? "?"} – ${closes ?? "?"}`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "priceRange",
      title: "Price range",
      description:
        'Optional, and never shown on the site. For example "$300-$450". ' +
        "Update it when the package prices change.",
      type: "string",
    }),
    defineField({
      name: "footerStatement",
      title: "Footer statement",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "navigationItems",
      title: "Primary navigation",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Path",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "href",
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
