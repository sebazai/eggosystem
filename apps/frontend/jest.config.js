import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
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
