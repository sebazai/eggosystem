import next from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";

import baseConfig from "./base.js";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const nextConfig = compat.config({
  extends: ["next", "prettier", "next/core-web-vitals", "next/typescript"],
});

export default [
  ...baseConfig,
  ...nextConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        JSX: true,
        React: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      next,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",

      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],

      "react/display-name": "off",
      "react/prop-types": "off",
      // React specific rules
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json"],
        },
      },
      react: {
        version: "detect",
      },
    },
  },
];
