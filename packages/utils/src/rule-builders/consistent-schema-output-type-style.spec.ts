import { describe, expect, it } from 'vitest';

import { ZOD_SCHEMA_TYPE_STYLES } from './consistent-schema-output-type-style.js';

describe('ZOD_SCHEMA_TYPE_STYLES', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(ZOD_SCHEMA_TYPE_STYLES)).toBe(true);
  });
});
