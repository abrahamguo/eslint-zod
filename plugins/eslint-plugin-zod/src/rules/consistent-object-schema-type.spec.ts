import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'dedent';

import { consistentObjectSchemaType } from './consistent-object-schema-type.js';

const ruleTester = new RuleTester();

ruleTester.run(consistentObjectSchemaType.name, consistentObjectSchemaType, {
  valid: [
    {
      name: 'namespace import',
      code: dedent`
        import * as z from 'zod';
        z.object({})
      `,
    },
    {
      name: 'named import',
      code: dedent`
        import { object } from 'zod';
        object({})
      `,
    },
    {
      name: 'named z import',
      code: dedent`
        import { z } from 'zod';
        z.object({})
      `,
    },
    {
      name: 'nested',
      options: [{ allow: ['looseObject', 'strictObject'] }],
      code: dedent`
        import * as z from 'zod';
        z.looseObject({ test: z.strictObject({}) })
      `,
    },
    {
      name: 'nested (named)',
      options: [{ allow: ['looseObject', 'strictObject'] }],
      code: dedent`
        import { looseObject, strictObject } from 'zod';
        looseObject({ test: strictObject({}) })
      `,
    },
  ],
  invalid: [
    {
      name: 'invalid usage',
      code: dedent`
        import * as z from 'zod';
        z.looseObject({})
      `,
      errors: [
        {
          messageId: 'consistentMethod',
          data: { actual: 'looseObject', allowedList: 'object' },
          suggestions: [
            {
              messageId: 'useMethod',
              data: { expected: 'object' },
              output: dedent`
                import * as z from 'zod';
                z.object({})
              `,
            },
          ],
        },
      ],
      output: null,
    },
    {
      name: 'invalid usage (named)',
      code: dedent`
        import { looseObject } from 'zod';
        looseObject()
      `,
      errors: [
        {
          messageId: 'consistentMethod',
          data: { actual: 'looseObject', allowedList: 'object' },
        },
      ],
      output: null,
    },
    {
      name: 'nested looseObject',
      code: dedent`
        import * as z from 'zod';
        z.object({ test: z.looseObject({}) })
      `,
      errors: [
        {
          messageId: 'consistentMethod',
          data: { actual: 'looseObject', allowedList: 'object' },
          suggestions: [
            {
              messageId: 'useMethod',
              data: { expected: 'object' },
              output: dedent`
                import * as z from 'zod';
                z.object({ test: z.object({}) })
              `,
            },
          ],
        },
      ],
    },
    {
      name: 'nested looseObject (named)',
      code: dedent`
        import { object, looseObject } from 'zod';
        object({ test: looseObject({}) })
      `,
      errors: [
        {
          messageId: 'consistentMethod',
          data: { actual: 'looseObject', allowedList: 'object' },
          suggestions: null,
        },
      ],
      output: null,
    },
    {
      name: 'the suggestion renames the factory, not the outermost call',
      code: dedent`
        import * as z from 'zod';
        z.strictObject({}).optional();
      `,
      errors: [
        {
          messageId: 'consistentMethod',
          data: { actual: 'strictObject', allowedList: 'object' },
          suggestions: [
            {
              messageId: 'useMethod',
              data: { expected: 'object' },
              output: dedent`
                import * as z from 'zod';
                z.object({}).optional();
              `,
            },
          ],
        },
      ],
    },
  ],
});
