import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'dedent';

import { preferMetaLast } from './prefer-meta-last.js';

const ruleTester = new RuleTester();

ruleTester.run(preferMetaLast.name, preferMetaLast, {
  valid: [
    {
      name: 'meta() is the last schema method before a parse call',
      code: dedent`
        import * as z from 'zod';
        z.string().min(1).meta({ a: 1 }).parse(x);
        z.string().meta({ a: 1 }).safeParse(x);
      `,
    },
    {
      name: 'namespace import',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ description: "desc" })
      `,
    },
    {
      name: 'named import',
      code: dedent`
        import { string } from 'zod';
        string().meta({ description: "desc" })
      `,
    },
    {
      name: 'named z import',
      code: dedent`
        import { z } from 'zod';
        z.string().meta({ description: "desc" })
      `,
    },
    {
      name: 'No meta... no error',
      code: dedent`
        import * as z from 'zod';
        z.string().min(5).max(10);
      `,
    },
    {
      name: 'multiple methods, but meta() is last',
      code: `
        import * as z from 'zod';
        z.string().min(5).max(10).meta({ description: "my string" });
      `,
    },
    {
      name: 'multiple chained meta at the end (still valid)',
      code: dedent`
        import * as z from 'zod';
        z.string().min(5).max(10).meta({ a: 1 }).meta({ b: 2 });
      `,
    },
    {
      // https://github.com/marcalexiei/eslint-zod/issues/42
      name: 'meta not belonging to zod',
      code: dedent`
        export const t = initTRPC
          .meta<Meta>()
          .context<typeof createTRPCContext>()
          .create({});
      `,
    },
    {
      name: 'meta not belonging to zod',
      code: 'const t = meta<Meta>()',
    },
    {
      // https://github.com/marcalexiei/eslint-zod/issues/70
      name: 'inside object',
      code: dedent`
        import * as z from 'zod';
        export const baseEventPayloadSchema = z.object({
          type: z.string(),
          action: z.string().meta({ description: "a" }),
        })
      `,
    },
    {
      // https://github.com/marcalexiei/eslint-zod/issues/42
      name: 'inside looseObject',
      code: dedent`
        import * as z from 'zod';
        export const baseEventPayloadSchema = z.looseObject({
          type: z.string(),
          action: z.string().meta({ description: "a" }),
        })
      `,
    },
    {
      // https://github.com/marcalexiei/eslint-zod/issues/42
      name: 'inside strictObject',
      code: dedent`
        import * as z from 'zod';
        export const baseEventPayloadSchema = z.strictObject({
          type: z.string(),
          action: z.string().meta({ description: "a" }),
        })
      `,
    },
    {
      name: 'a factory imported as meta is not the method',
      code: dedent`
        import { string as meta } from 'zod';
        meta().min(1);
      `,
    },
    {
      name: 'meta before a method that does not return a schema',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ title: 'Name' }).toJSONSchema();
        z.string().meta({ title: 'Name' }).isOptional();
        z.string().meta({ title: 'Name' }).apply((schema) => schema.parse('a'));
      `,
    },
  ],

  invalid: [
    {
      name: 'after a property access',
      code: dedent`
        import * as z from 'zod';
        z.object({ id: z.string() }).shape.id.meta({ foo: "bar" }).optional();
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import * as z from 'zod';
        z.object({ id: z.string() }).shape.id.optional().meta({ foo: "bar" });
      `,
    },
    {
      name: 'meta() before another method (namespace import)',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ description: "desc" }).trim();
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import * as z from 'zod';
        z.string().trim().meta({ description: "desc" });
      `,
    },
    {
      name: 'meta() before another method (named import)',
      code: dedent`
        import { string } from 'zod';
        string().meta({ description: "desc" }).trim();
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import { string } from 'zod';
        string().trim().meta({ description: "desc" });
      `,
    },
    {
      name: 'meta() before another method (named z import)',
      code: dedent`
        import { z } from 'zod';
        z.string().meta({ description: "desc" }).trim();
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import { z } from 'zod';
        z.string().trim().meta({ description: "desc" });
      `,
    },
    {
      name: 'meta() followed by transform()',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ foo: "bar" }).transform(x => x.toUpperCase());
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import * as z from 'zod';
        z.string().transform(x => x.toUpperCase()).meta({ foo: "bar" });
      `,
    },
    {
      name: 'meta() in the middle of the chain',
      code: dedent`
        import * as z from 'zod';
        z.string().min(5).meta({ foo: "bar" }).max(10);
      `,
      errors: [{ messageId: 'metaNotLast', line: 2, column: 19, endColumn: 23 }],
      output: dedent`
        import * as z from 'zod';
        z.string().min(5).max(10).meta({ foo: "bar" });
      `,
    },
    {
      // https://github.com/marcalexiei/eslint-zod/issues/42
      name: 'inside strictObject',
      code: dedent`
        import * as z from 'zod';
        export const baseEventPayloadSchema = z.strictObject({
          type: z.string(),
          action: z.string().meta({ description: "a" }).min(1),
        })
      `,
      errors: [{ messageId: 'metaNotLast', line: 4, column: 22, endColumn: 26 }],
      output: dedent`
        import * as z from 'zod';
        export const baseEventPayloadSchema = z.strictObject({
          type: z.string(),
          action: z.string().min(1).meta({ description: "a" }),
        })
      `,
    },
    {
      name: 'parenthesized receiver — reported without a fix',
      code: dedent`
        import * as z from 'zod';
        (z.string()).meta({ foo: "bar" }).min(1);
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: null,
    },
    {
      name: 'meta() is moved before a parse call, not after it',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ a: 1 }).min(1).parse(x);
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import * as z from 'zod';
        z.string().min(1).meta({ a: 1 }).parse(x);
      `,
    },
    {
      name: 'a moved meta() stays ahead of a later one',
      code: dedent`
        import * as z from 'zod';
        z.string().meta({ title: 'A' }).min(1).meta({ title: 'B' });
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: dedent`
        import * as z from 'zod';
        z.string().min(1).meta({ title: 'A' }).meta({ title: 'B' });
      `,
    },
    {
      name: 'comment in the rewritten text — reported without a fix',
      code: dedent`
        import * as z from 'zod';
        z.string()
          // keep
          .meta({ a: 1 })
          .min(1);
      `,
      errors: [{ messageId: 'metaNotLast' }],
      output: null,
    },
  ],
});
