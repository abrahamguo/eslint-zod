import { getZodChainedMethodNames, zodImportScope } from '@eslint-zod/utils';

import { createZodPluginRule } from '../utils/create-plugin-rule.js';

export const noNumberSchemaWithStep = createZodPluginRule({
  name: 'no-number-schema-with-step',
  meta: {
    fixable: 'code',
    type: 'problem',
    docs: {
      description: 'Disallow deprecated `z.number().step()`. Use `.multipleOf()` instead.',
    },
    messages: {
      useMultipleOf: '`.step()` is deprecated. Use `.multipleOf()` with the same argument instead.',
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const { createSchemaVisitor, collectZodChainMethods } = zodImportScope.createTracker({
      kind: 'value',
    });

    return createSchemaVisitor({
      schemaType: 'number',
      onSchema(node, zodSchemaMeta): void {
        // Detect on the names alone: they exclude the factory,
        // so an aliased named import (`import { number as step }`) is not mistaken for a `.step()` call,
        // and a computed factory (`z['number']().step(5)`) is still caught even though the chain walker cannot name it.
        if (!getZodChainedMethodNames(zodSchemaMeta).includes('step')) {
          return;
        }

        // Skip index 0 — that item is the `number()` factory itself.
        const step = collectZodChainMethods(node).find(
          (m, index) => index > 0 && m.name === 'step',
        );

        context.report({
          node,
          messageId: 'useMultipleOf',
          fix(fixer) {
            // A computed factory leaves no nameable `.step()` node to rename.
            // Rename the `step` call's own property, not the chain's outermost one:
            // in `z.number().step(5).min(0)` the outermost callee is `.min`.
            return step?.member ? fixer.replaceText(step.member.property, 'multipleOf') : null;
          },
        });
      },
    });
  },
});
