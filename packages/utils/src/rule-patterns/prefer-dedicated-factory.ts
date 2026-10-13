import type { TSESLint } from '@typescript-eslint/utils';

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

/**
 * Prefers a dedicated factory over a general one plus a chained modifier (`z.looseObject()` over `z.object().passthrough()`).
 * The fix renames the factory and drops the modifier;
 * it bails on named imports (would need a new import), on a modifier with arguments (nowhere to put them),
 * and when an overriding method sits between the factory and the modifier.
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
        if (!zodSchemaMeta.methods.some((name) => modifierMethods.includes(name))) {
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
            // A named declaration has no `<ns>.<factory>` member to rewrite.
            const factoryCallee = methods.at(0)?.member;
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
