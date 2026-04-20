import { config as baseConfig } from "@eggosystem/eslint/express";
export default [
  ...baseConfig,
  {
    ignores: ["babel.config.cjs", "scripts/**/*.js"]
  }
];
