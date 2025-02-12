export const preset = "ts-jest";
export const testEnvironment = "node";
export const moduleFileExtensions = ["ts", "tsx", "js", "jsx", "json", "node"];
export const setupFilesAfterEnv = ["<rootDir>/jest.setup.ts"];
export const transform = {
  "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
};
export const openHandlesTimeout = 2 * 1000;
export const testMatch = ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"];
export const reporters = [
  "default",
  [
    "jest-junit",
    { outputDirectory: "./test-results/junit", outputName: "results.xml" },
  ],
];
