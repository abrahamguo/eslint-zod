import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'dedent';

import { noThrowInRefine } from './no-throw-in-refine.js';

const ruleTester = new RuleTester();

ruleTester.run(noThrowInRefine.name, noThrowInRefine, {
  valid: [
    {
      name: 'refine with arrow body shorthand',
      code: dedent`
        import * as z from 'zod';
        z.number().min(0).refine((val) => true);
      `,
    },
    {
      name: 'nested function not reported',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => {
          const fn = () => { throw new Error("nested"); }; // nested function is fine
          return val.length > 0;
        });
      `,
    },
    {
      name: 'refine not starting with `z`',
      code: 'anotherLibrary.number().min(0).refine((val) => { throw Error("boom") });',
    },
    {
      name: 'nested function declaration not reported',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => {
          function nested() { throw new Error("nested"); }
          return val.length > 0;
        });
      `,
    },
    {
      name: 'returned arrow function not reported',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => () => { throw new Error("nested"); });
      `,
    },
    {
      name: 'returned function expression not reported',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => function () { throw new Error("nested"); });
      `,
    },
    {
      name: 'argument-less `.refine()` — invalid zod, valid JS, must not crash',
      code: dedent`
        import * as z from 'zod';
        z.string().refine();
      `,
    },
  ],
  invalid: [
    {
      name: 'inside arrow function',
      code: dedent`
        import * as z from 'zod';
        z.string().refine(() => { throw new Error(); });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside arrow function (named)',
      code: dedent`
        import { string } from 'zod';
        string().refine(() => { throw new Error(); });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside arrow function within if',
      code: dedent`
        import * as z from 'zod';
        z.number().refine((val) => {
          if (val < 0) throw new Error('Invalid');
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside arrow function within else',
      code: dedent`
        import * as z from 'zod';
        z.number().refine((val) => {
          if (val < 0) return true
          else throw new Error('Invalid');
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside arrow function within cycle',
      code: dedent`
        import * as z from 'zod';
        z.number().refine((val) => {
          for (const it of val) {
            throw new Error('Invalid')
          }
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside arrow function within cycle and chained method',
      code: dedent`
        import * as z from 'zod';
        z.number().refine((val) => {
          for (const it of val) {
            throw new Error('Invalid')
          }
        }).array();
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside a function-expression callback',
      code: dedent`
        import * as z from 'zod';
        z.string().refine(function (val) {
          throw new Error('Invalid');
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside a classic for loop',
      code: dedent`
        import * as z from 'zod';
        z.number().refine((val) => {
          for (let i = 0; i < val; i += 1) {
            throw new Error('Invalid')
          }
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside a for-in loop',
      code: dedent`
        import * as z from 'zod';
        z.object({}).refine((val) => {
          for (const key in val) {
            throw new Error('Invalid')
          }
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'inside every branch of a try statement',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => {
          try {
            throw new Error('try');
          } catch {
            throw new Error('catch');
          } finally {
            throw new Error('finally');
          }
        });
      `,
      errors: [
        { messageId: 'noThrowInRefine' },
        { messageId: 'noThrowInRefine' },
        { messageId: 'noThrowInRefine' },
      ],
    },
    {
      name: 'throw in a later refine of the same chain',
      code: dedent`
        import * as z from 'zod';
        z.string().refine(() => true).refine((val) => {
          throw new Error('x');
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }],
    },
    {
      name: 'throw inside a switch case and a labelled block',
      code: dedent`
        import * as z from 'zod';
        z.string().refine((val) => {
          switch (val) {
            case 'a':
              throw new Error('x');
            default:
              outer: {
                throw new Error('y');
              }
          }
        });
      `,
      errors: [{ messageId: 'noThrowInRefine' }, { messageId: 'noThrowInRefine' }],
    },
  ],
});
