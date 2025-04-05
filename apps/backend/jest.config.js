export const preset = "ts-jest";
export const testEnvironment = "node";
export const moduleFileExtensions = ["ts", "tsx", "js", "jsx", "json", "node"];
export const setupFilesAfterEnv = ["<rootDir>/jest.setup.ts"];
export const transform = {
  "^.+\\.(ts|tsx)$": "ts-jest"
};
export const openHandlesTimeout = 2 * 1000;
export const testMatch = [
  "**/__tests__/**/*.ts?(x)",
  "**/?(*.)+(spec|test).ts?(x)"
];
export const reporters = [
  "default",
  [
    "jest-junit",
    { outputDirectory: "./test-results/junit", outputName: "results.xml" }
  ]
];

// Coverage configuration
export const collectCoverage = true;
export const coverageReporters = ["text", "cobertura"];
export const coverageDirectory = "coverage";
export const collectCoverageFrom = ["src/**/*.{js,jsx,ts,tsx}"];
export const coveragePathIgnorePatterns = [
  "/node_modules/",
  "/test-results/",
  "/dist/"
];
export const coverageProvider = "v8";
export const moduleNameMapper = {
  "^@eggosystem/types$": "<rootDir>/../../packages/types/dist/index.js"
};
