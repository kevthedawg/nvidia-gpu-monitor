import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

import { createBaseConfig } from "../../eslint.config.js";

// @ts-expect-error - ESM config file
const base = createBaseConfig({ tsconfigRootDir: import.meta.dirname });

export default [
  ...base,
  {
    files: ["**/*.tsx", "**/*.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: { react },
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: false,
          ignoreProps: true,
        },
      ],
    },
  },
];
