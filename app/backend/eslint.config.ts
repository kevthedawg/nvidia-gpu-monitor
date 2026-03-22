import { createBaseConfig } from '../../eslint.config.js';

// @ts-expect-error - ESM config file
export default createBaseConfig({ tsconfigRootDir: import.meta.dirname });
