import { RuleCreator } from '@typescript-eslint/utils/eslint-utils';

import { getRuleURL } from '../meta.js';

export const createZodMiniPluginRule = RuleCreator(getRuleURL);
