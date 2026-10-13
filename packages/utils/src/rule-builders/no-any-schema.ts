import type { TSESLint } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import type { ZodImportScope } from '../zod-import-scope.js';

type MessageIds = 'noZAny' | 'useUnknown';

export function buildNoAnySchemaCreate(
  scope: ZodImportScope,
): (context: Readonly<TSESLint.RuleContext<MessageIds, []>>) => TSESLint.RuleListener {
  return function create(context) {
    const { createSchemaVisitor, collectZodChainMethods } = scope.createTracker({ kind: 'value' });

    return createSchemaVisitor({
      schemaType: 'any',
      onSchema(node): void {
        // A call of a call (`z.any()()`) is left alone.
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier &&
          node.callee.type !== AST_NODE_TYPES.MemberExpression
        ) {
          return;
        }

        // No member for a named import (`any()`) or a computed factory (`z['any']()`):
        // neither can be renamed, so those are reported without the suggestion.
        const factoryCallee = collectZodChainMethods(node).at(0)?.member;

        context.report({
          node,
          messageId: 'noZAny',
          suggest: factoryCallee
            ? [
                {
                  messageId: 'useUnknown',
                  fix(fixer): TSESLint.RuleFix {
                    return fixer.replaceText(factoryCallee.property, 'unknown');
                  },
                },
              ]
            : [],
        });
      },
    });
  };
}
