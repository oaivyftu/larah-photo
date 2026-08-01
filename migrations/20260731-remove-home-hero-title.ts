import { at, defineMigration, unset, type NodePatch } from "sanity/migrate";

/* The redesigned hero leads with the logo mark and a single tagline, so the
   eyebrow and the per-word title array no longer render anywhere. */
const removedFields = ["eyebrow", "titleWords"] as const;

export default defineMigration({
  title: "Remove the home hero eyebrow and title words",
  documentTypes: ["homePage"],

  migrate: {
    document(document) {
      const patches: NodePatch[] = [];

      for (const field of removedFields) {
        if (field in document) {
          patches.push(at(field, unset()));
        }
      }

      return patches;
    },
  },
});
