import { fixupPluginRules } from "@eslint/compat";
import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        React: "readonly",
        NodeJS: "readonly",
        RequestInfo: "readonly",
        RequestInit: "readonly",
        FrameRequestCallback: "readonly"
      }
    }
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: {
      react: fixupPluginRules(pluginReact),
      "react-hooks": fixupPluginRules(pluginReactHooks),
      "@next/next": pluginNext
    },
    settings: {
      react: { version: "detect" }
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "error",
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Relax some React Hooks rules for Next.js 16 compatibility
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_", // Ignore unused function arguments
          varsIgnorePattern: "^_", // Ignore unused variables
          caughtErrorsIgnorePattern: "^_", // Ignore unused catch clause parameters
          ignoreRestSiblings: true //  Ignore unused properties when using object destructuring
        }
      ],
      // Allow variable redeclaration in some cases
      "no-redeclare": "warn"
    }
  },
  {
    files: ["**/*.ts", "**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: [
      "**/*.config.{js,ts}",
      "**/next.config.{js,ts}",
      "**/playwright.config.{js,ts}",
      "**/robots.{js,ts}",
      "**/env.{js,ts}"
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        process: "readonly"
      }
    }
  }
];
