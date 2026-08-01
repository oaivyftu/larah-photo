import { at, defineMigration, unset } from "sanity/migrate";

export default defineMigration({
  title: "Remove the work span field now that the work index is uniform-width",
  documentTypes: ["workProject"],
  filter: "defined(workSpan)",

  migrate: {
    document() {
      return at("workSpan", unset());
    },
  },
});
