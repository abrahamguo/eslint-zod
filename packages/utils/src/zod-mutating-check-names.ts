/**
 * Zod check names that mutate the validated value instead of just asserting on it.
 * Used in `zod` as chained methods on a schema; used in `zod-mini` as standalone
 * `$ZodCheck` calls passed to `.check(...)`.
 * `slugify` exists in `zod` only.
 */
export const ZOD_MUTATING_CHECK_NAMES = Object.freeze([
  'normalize',
  'overwrite',
  'slugify',
  'toLowerCase',
  'toUpperCase',
  'trim',
]);
