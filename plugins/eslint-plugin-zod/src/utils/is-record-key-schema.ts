import { findParentSchemaMatchingCondition } from '@eslint-zod/utils';
import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Whether `node` is the key schema of a `z.record()`.
 * A transform on a record key causes data loss, so the trim rules leave it alone.
 *
 * @see https://github.com/marcalexiei/eslint-zod/issues/242
 */
export function isRecordKeySchema(node: TSESTree.CallExpression): boolean {
  return findParentSchemaMatchingCondition(node, {
    schemaName: 'record',
    condition: (callParent) => callParent.arguments.at(0) === node,
  });
}
