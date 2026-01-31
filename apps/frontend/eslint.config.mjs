import { config as nextJsConfig } from "@eggosystem/eslint/next";

export default [
  ...nextJsConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "playwright-report/**",
      "next-env.d.ts",
      "**/*.test.{js,jsx,ts,tsx}",
      "**/*.spec.{js,jsx,ts,tsx}",
      "**/test/**/*.{js,jsx,ts,tsx}",
      "**/jest.setup.{js,ts}",
      "**/test-utils/**/*.{js,jsx,ts,tsx}",
      "**/e2e/**/*.{js,ts}"
    ]
  },
  {
    rules: {
      "@next/next/no-img-element": "error"
    }
  }
];
