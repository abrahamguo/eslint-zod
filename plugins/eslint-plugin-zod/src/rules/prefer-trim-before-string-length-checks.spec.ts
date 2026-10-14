import { RuleTester } from '@typescript-eslint/rule-tester';
import dedent from 'dedent';

import { preferTrimBeforeStringLengthChecks } from './prefer-trim-before-string-length-checks.js';

const ruleTester = new RuleTester();

ruleTester.run(preferTrimBeforeStringLengthChecks.name, preferTrimBeforeStringLengthChecks, {
  valid: [
    {
      name: 'key schema of partialRecord and looseRecord',
      code: dedent`
        import * as z from 'zod';
        z.partialRecord(z.string().min(1).trim(), z.number());
        z.looseRecord(z.string().min(1).trim(), z.number());
      `,
    },
    {
      name: 'trim before min',
      code: dedent`
          import * as z from "zod";
          z.string().trim().min(1);
        `,
    },
    {
      name: 'trim before max',
      code: dedent`
          import * as z from "zod";
          z.string().trim().max(10);
        `,
    },
    {
      name: 'trim before length',
      code: dedent`
          import * as z from "zod";
          z.string().trim().length(5);
        `,
    },
    {
      name: 'trim before multiple length checks',
      code: dedent`
          import * as z from "zod";
          z.string().trim().min(1).max(10);
        `,
    },
    {
      name: 'trim before min with optional',
      code: dedent`
          import * as z from "zod";
          z.string().trim().min(1).optional();
        `,
    },
    {
      name: 'string schema without length checks',
      code: dedent`
          import * as z from "zod";
          z.string().trim();
        `,
    },
    {
      name: 'string schema without trim',
      code: dedent`
          import * as z from "zod";
          z.string().min(1);
        `,
    },
    {
      name: 'named z import - trim before min',
      code: dedent`
          import { z } from "zod";
          z.string().trim().min(1);
        `,
    },
    {
      name: 'named import - trim before min',
      code: dedent`
          import { string } from "zod";
          string().trim().min(1);
        `,
    },
    {
      name: 'not a string schema',
      code: dedent`
          import * as z from "zod";
          z.number().min(1);
        `,
    },
    {
      name: 'string schema as record key',
      code: dedent`
          import * as z from "zod";
          z.record(z.string().min(1).trim(), z.unknown());
        `,
    },
    {
      name: 'string schema as the key of a record built from named imports',
      code: dedent`
        import { number, record, string } from 'zod';
        record(string().min(1).trim(), number());
      `,
    },
  ],

  invalid: [
    {
      name: 'namespace import - min before trim',
      code: dedent`
          import * as z from "zod";
          z.string().min(1).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import * as z from "zod";
          z.string().trim().min(1);
        `,
    },
    {
      name: 'namespace import - max before trim',
      code: dedent`
          import * as z from "zod";
          z.string().max(10).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import * as z from "zod";
          z.string().trim().max(10);
        `,
    },
    {
      name: 'namespace import - length before trim',
      code: dedent`
          import * as z from "zod";
          z.string().length(5).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import * as z from "zod";
          z.string().trim().length(5);
        `,
    },
    {
      name: 'namespace import - min before trim with optional after',
      code: dedent`
          import * as z from "zod";
          z.string().min(1).trim().optional();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import * as z from "zod";
          z.string().trim().min(1).optional();
        `,
    },
    {
      name: 'namespace import - multiple length checks before trim',
      code: dedent`
          import * as z from "zod";
          z.string().min(1).max(10).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import * as z from "zod";
          z.string().trim().min(1).max(10);
        `,
    },
    {
      name: 'named z import - min before trim',
      code: dedent`
          import { z } from "zod";
          z.string().min(1).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
          import { z } from "zod";
          z.string().trim().min(1);
        `,
    },
    {
      name: 'named import - min before trim',
      code: dedent`
          import { string } from "zod";
          string().min(1).trim();
        `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: null,
    },
    {
      name: 'parenthesized receiver — reported without a fix',
      code: dedent`
        import * as z from 'zod';
        (z.string().min(1)).trim();
      `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: null,
    },
    {
      name: 'comment in the rewritten text — reported without a fix',
      code: dedent`
        import * as z from 'zod';
        z.string()
          .min(1)
          // keep
          .trim();
      `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: null,
    },
    {
      name: 'trim after nonempty',
      code: dedent`
        import * as z from 'zod';
        z.string().nonempty().trim();
      `,
      errors: [{ messageId: 'trimBeforeLengthCheck' }],
      output: dedent`
        import * as z from 'zod';
        z.string().trim().nonempty();
      `,
    },
  ],
});
