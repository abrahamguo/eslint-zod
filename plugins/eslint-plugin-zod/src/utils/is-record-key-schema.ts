import { findParentSchemaMatchingCondition } from '@eslint-zod/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const RECORD_FACTORIES = ['record', 'partialRecord', 'looseRecord'];

/**
 * Whether `node` is the key schema of a `z.record()`, `z.partialRecord()` or `z.looseRecord()`.
 * A transform on a record key causes data loss, so the trim rules leave it alone.
 *
 * @see https://github.com/marcalexiei/eslint-zod/issues/242
 */
export function isRecordKeySchema(node: TSESTree.CallExpression): boolean {
  return RECORD_FACTORIES.some((schemaName) =>
    findParentSchemaMatchingCondition(node, {
      schemaName,
      condition: (callParent) => callParent.arguments.at(0) === node,
    }),
  );
}
