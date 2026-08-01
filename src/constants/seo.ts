/**
 * Search engine visibility is opt-in: the site stays fully hidden until
 * `NEXT_PUBLIC_SITE_INDEXABLE` is explicitly set to "true" in the environment.
 *
 * To launch: set NEXT_PUBLIC_SITE_INDEXABLE=true on the Production environment
 * only, then redeploy. Preview and development deployments stay blocked.
 */
export const isIndexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
