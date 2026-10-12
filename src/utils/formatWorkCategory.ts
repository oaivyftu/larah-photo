export function normalizeWorkCategory(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

export function formatWorkCategory(category: string) {
  return normalizeWorkCategory(category)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The one category matcher: the landing page filtering projects, the project
 * page finding its landing link and the Studio's "matches no project" advisory
 * all call this, so they cannot disagree about spacing or case (spec 014
 * research.md §3). `normalizeWorkCategory` is idempotent, so it is correct on a
 * raw Studio string and on an already-normalised `Project.category` alike.
 */
export function categoriesMatch(a: string, b: string): boolean {
  return normalizeWorkCategory(a) === normalizeWorkCategory(b);
}
