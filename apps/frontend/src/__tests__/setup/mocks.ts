/**
 * Global test mocks
 * This file contains Jest mocks that should be available in all tests
 */

import { MockWithRoleProtection } from "../utils/test-utils";

// =============================================================================
// GLOBAL COMPONENT MOCKS
// =============================================================================

/**
 * Mock WithRoleProtection component globally
 * This prevents auth context issues in dashboard/admin component tests
 */
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: MockWithRoleProtection
}));

// =============================================================================
// ENVIRONMENT MOCKS
// =============================================================================

/**
 * Mock Next.js router
 */
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: "/test",
    query: {},
    asPath: "/test"
  })
}));

/**
 * Mock Next.js navigation
 */
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => "/test",
  useSearchParams: () => new URLSearchParams()
}));

// =============================================================================
// API MOCKS
// =============================================================================

/**
 * Mock fetch API globally if not already done
 */
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      statusText: "OK"
    } as Response)
  );
}

// =============================================================================
// EXPORT MOCK FACTORIES
// =============================================================================

/**
 * Factory for creating consistent hook mocks
 */
export const createHookMock = <T>(defaultReturn: T) => {
  return jest.fn(() => defaultReturn);
};

/**
 * Factory for creating SWR hook mocks
 */
export const createSWRMock = <T>(
  data: T,
  isLoading = false,
  error: unknown = null
) => {
  return jest.fn(() => ({
    data,
    error,
    isLoading,
    isValidating: false,
    mutate: jest.fn()
  }));
};

/**
 * Factory for creating async hook mocks (like mutations)
 */
export const createAsyncHookMock = <T>(
  defaultAction: (...args: unknown[]) => Promise<T>
) => {
  return jest.fn(() => ({
    execute: jest.fn(defaultAction),
    isLoading: false,
    error: null
  }));
};
