// Mirrors src/styles/_breakpoints.scss, which is the authority. SCSS variables
// aren't importable into JS without extra build tooling, so this copy exists —
// but it is no longer kept in sync by hand: breakpoints.test.ts reads the SCSS
// and fails if a mirrored value here disagrees with it.
//
// Mirroring is opt-in. Adding a breakpoint to the SCSS does not oblige this
// file to carry it; naming one here does oblige it to match.
export const BREAKPOINT_PHONE_LG = 620;
export const BREAKPOINT_TABLET_LG = 900;
