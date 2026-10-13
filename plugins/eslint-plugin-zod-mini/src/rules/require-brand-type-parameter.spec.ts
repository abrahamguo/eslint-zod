import { createSuggestionCases } from '@eslint-zod/tooling/vitest/rule-tester-cases';
import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'dedent';

import { requireBrandTypeParameter } from './require-brand-type-parameter.js';

const { suggest } = createSuggestionCases(requireBrandTypeParameter, {
  messageId: 'missingTypeParameter',
  suggestionMessageId: 'removeBrandFunction',
});

const ruleTester = new RuleTester();

ruleTester.run(requireBrandTypeParameter.name, requireBrandTypeParameter, {
  valid: [
    {
      name: 'namespace with type parameter',
      code: dedent`
        import * as z from 'zod/mini'
        z.string().brand<"id">();
      `,
    },
    {
      name: 'named import with type parameter',
      code: dedent`
        import { string } from 'zod/mini'
        string().brand<"id">();
      `,
    },
    {
      name: 'named z import with type parameter',
      code: dedent`
        import { z } from 'zod/mini'
        z.string().brand<"id">();
      `,
    },
    {
      name: 'no error on other brand function',
      code: dedent`
        import * as z from 'zod/mini'
        another.brand();
      `,
    },
    {
      name: 'not triggered on zod import',
      code: dedent`
        import * as z from 'zod';
        z.string().brand();
      `,
    },
    {
      name: 'complex chain',
      code: dedent`
        import * as z from 'zod/mini'
        z.string().check(z.minLength(1), z.maxLength(10)).brand<"email">();
      `,
    },
    {
      name: 'a factory named brand is not the method',
      code: dedent`
        import { brand } from 'zod/mini'
        brand();
      `,
    },
  ],

  invalid: [
    suggest(
      'after a property access',
      dedent`
        import * as z from 'zod/mini';
        z.object({ id: z.string() }).shape.id.brand();
      `,
      dedent`
        import * as z from 'zod/mini';
        z.object({ id: z.string() }).shape.id;
      `,
    ),
    suggest(
      'namespace import',
      dedent`
        import * as z from 'zod/mini';
        z.string().brand();
      `,
      dedent`
                import * as z from 'zod/mini';
                z.string();
              `,
    ),
    suggest(
      'named import',
      dedent`
        import { string } from 'zod/mini';
        string().brand();
      `,
      dedent`
                import { string } from 'zod/mini';
                string();
              `,
    ),
    suggest(
      'named z import',
      dedent`
        import { z } from 'zod/mini';
        z.string().brand();
      `,
      dedent`
                import { z } from 'zod/mini';
                z.string();
              `,
    ),
    suggest(
      'zod/v4-mini import',
      dedent`
        import * as z from 'zod/v4-mini';
        z.string().brand();
      `,
      dedent`
                import * as z from 'zod/v4-mini';
                z.string();
              `,
    ),
    suggest(
      'complex chain without type parameter',
      dedent`
        import * as z from 'zod/mini';
        z.string().check(z.minLength(1)).brand()
      `,
      dedent`
                import * as z from 'zod/mini';
                z.string().check(z.minLength(1))
              `,
    ),
    {
      name: 'parenthesized receiver — reported without the suggestion',
      code: dedent`
        import * as z from 'zod/mini';
        (z.string()).brand();
      `,
      errors: [{ messageId: 'missingTypeParameter' }],
    },
  ],
});
