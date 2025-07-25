/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["react-jsx"]
  },
  testMatch: ["<rootDir>/src/__tests__/unit/**/*.(test|spec).(js|jsx|ts|tsx)"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__tests__/**/*"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/src/__tests__/e2e/"
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/standalone/", "<rootDir>/dist/"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "cobertura"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "test-results/junit",
        outputName: "results.xml"
      }
    ]
  ]
};

module.exports = createJestConfig(customJestConfig);
