import { cpus } from "os";
import { existsSync } from "fs";

// Detect if running in devcontainer (common indicators)
const isDevContainer =
  process.env.DEVCONTAINER === "true" ||
  existsSync("/.devcontainer") ||
  process.env.CODESPACES === "true";

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
// Exclude dist from module resolution to prevent duplicate mock warnings
export const modulePathIgnorePatterns = ["<rootDir>/dist/"];
// Exclude dist from watch mode file watching
export const watchPathIgnorePatterns = ["<rootDir>/dist/"];
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

// Parallel execution configuration
// In devcontainers, use fewer workers due to volume mount I/O overhead
// Otherwise use 50% of available CPU cores, with a minimum of 2 and maximum of 8 workers
// This balances speed with resource usage and database connection limits
const getDefaultMaxWorkers = () => {
  if (isDevContainer) {
    // In devcontainer, be more conservative due to volume mount I/O overhead
    // Use 25% of cores, min 2, max 4
    return Math.max(2, Math.min(4, Math.floor(cpus().length * 0.25)));
  }
  // Normal environment: 50% of cores, min 2, max 8
  return Math.max(2, Math.min(8, Math.floor(cpus().length * 0.5)));
};

export const maxWorkers = process.env.JEST_MAX_WORKERS
  ? parseInt(process.env.JEST_MAX_WORKERS, 10)
  : getDefaultMaxWorkers();

// Cache configuration - optimize for devcontainer performance
// Use a cache directory that's not on the mounted volume if possible (faster I/O)
// Fallback to node_modules/.cache which is typically faster than root
export const cache = true;
export const cacheDirectory =
  process.env.JEST_CACHE_DIR ||
  (isDevContainer
    ? "<rootDir>/node_modules/.cache/jest"
    : "<rootDir>/.jest-cache");
