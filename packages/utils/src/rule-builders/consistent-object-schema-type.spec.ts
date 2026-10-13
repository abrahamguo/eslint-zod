import { describe, expect, it } from 'vitest';

import { ZOD_OBJECT_METHODS } from './consistent-object-schema-type.js';

describe('ZOD_OBJECT_METHODS', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(ZOD_OBJECT_METHODS)).toBe(true);
  });
});
