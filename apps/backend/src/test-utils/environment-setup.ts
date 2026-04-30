/**
 * Test utilities for environment setup
 * Provides helpers for managing environment variables in tests
 */

/**
 * Sets up FRONTEND_URL environment variable for tests
 * Returns a cleanup function that should be called in afterEach
 */
export function setupFrontendUrl(testUrl: string = "http://localhost:3000") {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = testUrl;

  return () => {
    // Restore original FRONTEND_URL
    if (originalFrontendUrl) {
      process.env.FRONTEND_URL = originalFrontendUrl;
    } else {
      delete process.env.FRONTEND_URL;
    }
  };
}

/**
 * Sets up multiple environment variables for tests
 * Returns a cleanup function that should be called in afterEach
 */
export function setupEnvironment(variables: Record<string, string>) {
  const originalValues: Record<string, string | undefined> = {};

  // Store original values and set new ones
  Object.entries(variables).forEach(([key, value]) => {
    originalValues[key] = process.env[key];
    process.env[key] = value;
  });

  return () => {
    // Restore original values
    Object.entries(originalValues).forEach(([key, originalValue]) => {
      if (originalValue !== undefined) {
        process.env[key] = originalValue;
      } else {
        delete process.env[key];
      }
    });
  };
}
