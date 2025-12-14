export const preset = "ts-jest";
export const testEnvironment = "node";
export const moduleFileExtensions = ["ts", "tsx", "js", "jsx", "json", "node"];
export const setupFilesAfterEnv = ["<rootDir>/jest.setup.ts"];
export const transform = {
  "^.+\\.(ts|tsx)$": "ts-jest",
  "^.+\\.(js|jsx)$": "babel-jest"
};
export const transformIgnorePatterns = [
  "node_modules/(?!.*(@eggosystem/shared-msw|msw|until-async))"
];
export const openHandlesTimeout = 2 * 1000;
export const testMatch = ["**/?(*.)+(spec|test).ts?(x)"];
export const testPathIgnorePatterns = ["/node_modules/", "<rootDir>/dist/"];
export const reporters = [
  "default",
  [
    "jest-junit",
    { outputDirectory: "./test-results/junit", outputName: "results.xml" }
  ]
];

// Coverage configuration
export const collectCoverage = true;
export const coverageReporters = ["text", "cobertura", "json"];
export const coverageDirectory = "coverage";
export const collectCoverageFrom = ["src/**/*.{js,jsx,ts,tsx}"];
export const coveragePathIgnorePatterns = [
  "/node_modules/",
  "/test-results/",
  "/dist/",
  "/__utils__/",
  "/src/types"
];
export const coverageProvider = "v8";
// Coverage thresholds - only enforce when not running in sharded CI mode
// In sharded mode, each shard only runs a subset of tests, so individual coverage will be lower
// A separate job merges coverage and enforces thresholds on the merged result
const isShardedCI =
  process.env.CI_NODE_TOTAL && parseInt(process.env.CI_NODE_TOTAL, 10) > 1;
export const coverageThreshold = isShardedCI
  ? undefined
  : {
      global: {
        branches: 65,
        functions: 50,
        lines: 60,
        statements: 60
      }
    };
export const moduleNameMapper = {
  "^@eggosystem/types$": "<rootDir>/../../packages/types/dist/index.js",
  "^@eggosystem/shared-msw$":
    "<rootDir>/../../packages/shared-msw/dist/index.js"
};
export const testTimeout = 10000;
