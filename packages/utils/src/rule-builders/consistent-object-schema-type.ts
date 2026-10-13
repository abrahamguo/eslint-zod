import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { TSESLint } from '@typescript-eslint/utils';

import type { ZodImportScope } from '../zod-import-scope.js';

export const ZOD_OBJECT_METHODS = Object.freeze(['object', 'looseObject', 'strictObject'] as const);

type ZodObjectMethod = (typeof ZOD_OBJECT_METHODS)[number];

export interface ConsistentObjectSchemaTypeOptions {
  allow: Array<ZodObjectMethod>;
}

type MessageIds = 'consistentMethod' | 'useMethod';

export function buildConsistentObjectSchemaTypeCreate(
  scope: ZodImportScope,
): (
  context: Readonly<TSESLint.RuleContext<MessageIds, [ConsistentObjectSchemaTypeOptions]>>,
  options: readonly [ConsistentObjectSchemaTypeOptions],
) => TSESLint.RuleListener {
  return function create(context, [{ allow: allowedList }]) {
    const { createSchemaVisitor, collectZodChainMethods } = scope.createTracker({ kind: 'value' });

    return createSchemaVisitor({
      schemaType: ZOD_OBJECT_METHODS,
      onSchema(node, { schemaType }): void {
        if (allowedList.includes(schemaType)) {
          return;
        }

        const { callee } = node;

        // A call of a call (`z.object({})()`) is left alone.
        if (
          callee.type !== AST_NODE_TYPES.Identifier &&
          callee.type !== AST_NODE_TYPES.MemberExpression
        ) {
          return;
        }

        // The factory, not `node.callee`: that is the outermost call (`.optional` in `z.object({}).optional()`).
        // Only `<namespace>.<factory>` can be renamed in place.
        const factory = collectZodChainMethods(node).at(0)?.member;
        const factoryName =
          factory?.object.type === AST_NODE_TYPES.Identifier ? factory.property : null;

        context.report({
          node,
          messageId: 'consistentMethod',
          data: { actual: schemaType, allowedList: allowedList.join(',') },
          suggest: factoryName
            ? allowedList.map<TSESLint.ReportSuggestionArray<MessageIds>[number]>((it) => ({
                messageId: 'useMethod',
                data: { expected: it },
                fix(fixer): TSESLint.RuleFix {
                  return fixer.replaceText(factoryName, it);
                },
              }))
            : [],
        });
      },
    });
  };
}
