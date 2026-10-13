import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { getStaticPropertyName } from '../get-static-property-name.js';
import { isZodFactoryChainItem } from '../is-zod-factory-chain-item.js';
import type { ZodImportScope } from '../zod-import-scope.js';

/** Options for {@link buildPreferDedicatedFactoryCreate}. */
export interface PreferDedicatedFactoryOptions<TMessageIds extends string> {
  scope: ZodImportScope;

  /** The general factory the modifier is chained on (e.g. `object`). */
  factoryName: string;

  /** Chained modifiers the dedicated factory replaces (e.g. `passthrough`, `loose`). */
  modifierMethods: ReadonlyArray<string>;

  /** The dedicated factory to use instead (e.g. `looseObject`). */
  replacementFactoryName: string;

  /**
   * Methods that undo or replace what the modifier sets (e.g. `catchall`, `merge`).
   * With one of them between the factory and the modifier, the fix is withheld:
   * hoisting the modifier into the factory would let that method override it.
   */
  overridingMethods?: ReadonlyArray<string>;

  /** Message reported on the modifier call. */
  messageId: TMessageIds;
}

/** Whether one of `names` is called in the chain `node` ends — a property of that name (`.shape.strict`) is not a call. */
function callsMethod(node: TSESTree.CallExpression, names: ReadonlyArray<string>): boolean {
  let current: TSESTree.Node = node;
  while (
    current.type === AST_NODE_TYPES.CallExpression ||
    current.type === AST_NODE_TYPES.MemberExpression
  ) {
    if (current.type === AST_NODE_TYPES.MemberExpression) {
      current = current.object;
      continue;
    }
    const callee: TSESTree.Expression = current.callee;
    if (callee.type === AST_NODE_TYPES.MemberExpression) {
      const name = getStaticPropertyName(callee);
      if (name !== null && names.includes(name)) {
        return true;
      }
    }
    current = callee;
  }
  return false;
}

/**
 * Prefers a dedicated factory over a general one plus a chained modifier (`z.looseObject()` over `z.object().passthrough()`).
 * The fix renames the factory and drops the modifier;
 * it bails on named imports (would need a new import), on a modifier with arguments (nowhere to put them),
 * when an overriding method sits between the factory and the modifier,
 * and when the modifier is called after a property access.
 */
export function buildPreferDedicatedFactoryCreate<TMessageIds extends string>(
  options: PreferDedicatedFactoryOptions<TMessageIds>,
): (context: Readonly<TSESLint.RuleContext<TMessageIds, []>>) => TSESLint.RuleListener {
  const {
    scope,
    factoryName,
    modifierMethods,
    replacementFactoryName,
    overridingMethods = [],
    messageId,
  } = options;

  return function create(context) {
    const { createSchemaVisitor, collectZodChainMethods } = scope.createTracker({ kind: 'value' });

    return createSchemaVisitor({
      schemaType: factoryName,
      onSchema(node, zodSchemaMeta): void {
        if (!callsMethod(node, modifierMethods)) {
          return;
        }

        const methods = collectZodChainMethods(node);
        // Empty when the chain runs through a computed member (`z['object']({}).passthrough()`):
        // detection named the modifier but the walker cannot,
        // so report on the schema and offer no fix.
        const modifierMethod = methods.find((it) => modifierMethods.includes(it.name));

        context.report({
          node: modifierMethod?.node ?? node,
          messageId,
          fix(fixer) {
            // A named declaration has no `<ns>.<factory>` member to rewrite,
            // and after a property access (`z.object({…}).shape.a.passthrough()`) the factory is out of reach.
            const factory = methods.at(0);
            const factoryCallee = factory && isZodFactoryChainItem(factory) ? factory.member : null;
            const modifierCallee = modifierMethod?.member;
            if (!factoryCallee || !modifierCallee || zodSchemaMeta.schemaDecl === 'named') {
              return null;
            }

            if (modifierMethod.node.arguments.length !== 0) {
              return null;
            }

            if (
              methods
                .slice(1, methods.indexOf(modifierMethod))
                .some((it) => overridingMethods.includes(it.name))
            ) {
              return null;
            }

            const { sourceCode } = context;

            const fixes = [
              fixer.replaceText(
                factoryCallee,
                `${sourceCode.getText(factoryCallee.object)}.${replacementFactoryName}`,
              ),
            ];

            const tokenBefore = sourceCode.getTokenBefore(modifierCallee.property);

            if (tokenBefore?.value === '.') {
              fixes.push(fixer.removeRange([tokenBefore.range[0], modifierMethod.node.range[1]]));
            }

            return fixes;
          },
        });
      },
    });
  };
}
