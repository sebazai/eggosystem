import { config as baseConfig } from "@eggosystem/eslint/base";
/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts"],
    ignores: ["node_modules/**"],
  },
];
