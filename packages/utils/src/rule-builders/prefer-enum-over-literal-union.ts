import type { TSESLint } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import type { ZodImportScope } from '../zod-import-scope.js';

export function buildPreferEnumOverLiteralUnionCreate(
  scope: ZodImportScope,
): (context: Readonly<TSESLint.RuleContext<'useEnum', []>>) => TSESLint.RuleListener {
  return function create(context) {
    const { createSchemaVisitor, detectZodSchemaRootNode, collectZodChainMethods } =
      scope.createTracker({ kind: 'value' });

    return createSchemaVisitor({
      schemaType: 'union',
      onSchema(node, zodSchemaMeta): void {
        const methods = collectZodChainMethods(node);
        const union = methods.find((it) => it.name === 'union');

        if (!union) {
          return;
        }

        const unionNode = union.node;

        const unionArgument = unionNode.arguments.at(0);
        if (
          unionArgument?.type !== AST_NODE_TYPES.ArrayExpression ||
          unionArgument.elements.length === 0
        ) {
          return;
        }

        const zodLiteralStrings = unionArgument.elements.map<string | null>((s) => {
          if (!s) {
            return null;
          }

          if (s.type !== AST_NODE_TYPES.CallExpression) {
            return null;
          }

          const maybeLiteralSchema = detectZodSchemaRootNode(s);
          if (maybeLiteralSchema?.schemaType !== 'literal') {
            return null;
          }

          // Only a bare `literal(value)` maps onto an enum member:
          // a chained method (`.describe()`) or a params argument would be lost,
          // and `s` is then that outer call rather than the `literal()` one.
          if (collectZodChainMethods(s).length !== 1 || s.arguments.length !== 1) {
            return null;
          }

          const [literalArgument] = s.arguments;
          if (
            literalArgument.type === AST_NODE_TYPES.Literal &&
            // Literal could be also a number
            typeof literalArgument.value === 'string'
          ) {
            // Use raw to keep the string format consistent with the original source
            return literalArgument.raw;
          }

          return null;
        });

        if (zodLiteralStrings.some((it) => it === null)) {
          return;
        }

        context.report({
          node,
          messageId: 'useEnum',
          fix(fixer) {
            if (zodSchemaMeta.schemaDecl === 'named' || !union.member) {
              return null;
            }

            return [
              fixer.replaceText(union.member.property, 'enum'),
              fixer.replaceText(unionNode.arguments[0], `[${zodLiteralStrings.join(', ')}]`),
            ];
          },
        });
      },
    });
  };
}
