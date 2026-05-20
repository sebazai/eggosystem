import nextJest from "next/jest.js";
import { fileURLToPath } from "node:url";

const createJestConfig = nextJest({
  dir: fileURLToPath(new URL(".", import.meta.url))
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testTimeout: 10000,
  testEnvironmentOptions: {
    customExportConditions: ["react-jsx"]
  },
  testMatch: ["<rootDir>/src/**/*.(test).(js|jsx|ts|tsx)"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
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
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
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

export default createJestConfig(customJestConfig);
