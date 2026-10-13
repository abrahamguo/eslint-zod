import type { TSESLint } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

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
    const { createSchemaVisitor } = scope.createTracker({ kind: 'value' });

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

        context.report({
          node,
          messageId: 'consistentMethod',
          data: { actual: schemaType, allowedList: allowedList.join(',') },
          // A named import (`object()`) has no property to rename.
          suggest:
            callee.type === AST_NODE_TYPES.MemberExpression
              ? allowedList.map<TSESLint.ReportSuggestionArray<MessageIds>[number]>((it) => ({
                  messageId: 'useMethod',
                  data: { expected: it },
                  fix(fixer): TSESLint.RuleFix {
                    return fixer.replaceText(callee.property, it);
                  },
                }))
              : [],
        });
      },
    });
  };
}
