import react from "eslint-plugin-react";

import { createBaseConfig } from "../../eslint.config.js";

// @ts-expect-error - ESM config file
const base = createBaseConfig({ tsconfigRootDir: import.meta.dirname });

export default [
  ...base,
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
