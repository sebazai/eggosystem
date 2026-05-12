import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

export const config = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        Express: true
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.eslint.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports"
        }
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true }
      ],
      // TypeScript specific rules
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ],

      "@typescript-eslint/require-await": "off",
      "import/no-default-export": "off",
      "import/prefer-default-export": "off",
      // Express and Node specific rules
      "no-console": ["warn", { allow: ["warn", "error"] }],

      "no-process-env": "off",
      // Error handling
      "no-unused-vars": "off"
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"]
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".ts"]
        },
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json"]
        }
      }
    }
  },
  {
    ignores: [
      "coverage/**",
      "eslint.config.mjs",
      "jest.config.js",
      "jest.config.mjs"
    ]
  }
];
