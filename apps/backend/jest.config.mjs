import { cpus } from "os";
import { existsSync } from "fs";

// Detect if running in devcontainer (common indicators)
const isDevContainer =
  process.env.DEVCONTAINER === "true" ||
  existsSync("/.devcontainer") ||
  process.env.CODESPACES === "true";

const isShardedCI =
  process.env.CI_NODE_TOTAL && parseInt(process.env.CI_NODE_TOTAL, 10) > 1;

const getDefaultMaxWorkers = () => {
  if (isDevContainer) {
    return Math.max(2, Math.min(4, Math.floor(cpus().length * 0.25)));
  }
  return Math.max(2, Math.min(8, Math.floor(cpus().length * 0.5)));
};

/** @type {import("jest").Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx|mjs|cjs)$": "babel-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*(@eggosystem/shared-msw|msw|@mswjs|@open-draft|rettime|until-async|strict-event-emitter|is-node-process|outvariant|headers-polyfill)/)"
  ],
  openHandlesTimeout: 2 * 1000,
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/dist/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  watchPathIgnorePatterns: ["<rootDir>/dist/"],
  reporters: [
    "default",
    [
      "jest-junit",
      { outputDirectory: "./test-results/junit", outputName: "results.xml" }
    ]
  ],
  collectCoverage: true,
  coverageReporters: ["text", "cobertura", "json"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test-results/",
    "/dist/",
    "/__utils__/",
    "/src/types"
  ],
  coverageProvider: "v8",
  coverageThreshold: isShardedCI
    ? undefined
    : {
        global: {
          branches: 65,
          functions: 50,
          lines: 60,
          statements: 60
        }
      },
  moduleNameMapper: {
    "^@eggosystem/types$": "<rootDir>/../../packages/types/dist/index.js",
    "^@eggosystem/shared-msw$":
      "<rootDir>/../../packages/shared-msw/dist/index.js"
  },
  testTimeout: 10000,
  maxWorkers: process.env.JEST_MAX_WORKERS
    ? parseInt(process.env.JEST_MAX_WORKERS, 10)
    : getDefaultMaxWorkers(),
  cache: true,
  cacheDirectory:
    process.env.JEST_CACHE_DIR ||
    (isDevContainer
      ? "<rootDir>/node_modules/.cache/jest"
      : "<rootDir>/.jest-cache")
};
