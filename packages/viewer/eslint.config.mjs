import { config as baseConfig } from "@eggosystem/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "public/**"]
  }
];
