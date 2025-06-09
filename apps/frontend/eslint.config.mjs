import { config as nextJsConfig } from "@eggosystem/eslint/next";

export default [
  ...nextJsConfig,
  {
    ignores: ["jest.config.js", "jest.setup.js"]
  }
];
