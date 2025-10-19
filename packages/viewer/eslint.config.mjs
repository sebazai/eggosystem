import { config as baseConfig } from "@eggosystem/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "public/**"]
  },
  {
    files: ["dev-server.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
