import { config as baseConfig } from "@eggosystem/eslint/base";
export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts"],
    ignores: ["node_modules/**"],
  },
];
