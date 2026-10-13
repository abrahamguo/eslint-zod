/** Object methods that set how unknown keys are handled, each overriding the previous one. */
export const OBJECT_CATCHALL_METHODS = [
  'catchall',
  'loose',
  'merge',
  'passthrough',
  'strict',
  'strip',
] as const;
