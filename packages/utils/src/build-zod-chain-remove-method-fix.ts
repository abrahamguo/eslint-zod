import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { hasParenthesizedReceiver } from './has-parenthesized-receiver.js';

/**
 * Remove one call from a zod method chain, e.g. `z.number().min(0).finite()` →
 * `z.number().min(0)`.
 *
 * Returns `null` when the call's receiver is parenthesized (`(z.number()).finite()`).
 */
export function buildZodChainRemoveMethodFix(opts: {
  fixer: TSESLint.RuleFixer;
  methods: Array<{ name: string; node: TSESTree.CallExpression }>;
  removeIndex: number;
}): TSESLint.RuleFix | null {
  const { fixer, methods, removeIndex } = opts;

  if (removeIndex < 1) {
    return null;
  }

  // prettier-ignore
  const prev = methods[removeIndex - 1]?.node as TSESTree.CallExpression | undefined;
  // prettier-ignore
  const toRemove = methods[removeIndex]?.node as TSESTree.CallExpression | undefined;

  if (!prev?.range || !toRemove?.range) {
    return null;
  }

  if (
    toRemove.callee.type === AST_NODE_TYPES.MemberExpression &&
    hasParenthesizedReceiver(toRemove.callee)
  ) {
    return null;
  }

  return fixer.removeRange([prev.range[1], toRemove.range[1]]);
}
