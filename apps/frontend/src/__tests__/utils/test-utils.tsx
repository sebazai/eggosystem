/**
 * Test utilities for frontend components
 * Provides common mocking patterns and helper functions
 */

import React from "react";
import {
  render,
  type RenderOptions,
  type RenderResult
} from "@testing-library/react";
import { SWRConfig } from "swr";

// Mock fetch API globally
if (!global.fetch) {
  global.fetch = jest.fn();
}

/**
 * Default SWR configuration for tests
 * Prevents actual API calls and provides fallback data
 */
const DEFAULT_SWR_CONFIG = {
  provider: () => new Map(),
  dedupingInterval: 0,
  fallback: {
    "/api/v1/organizations": [],
    "/api/v1/organizations/1/teams": []
  }
};

/**
 * Custom render function that wraps components with SWR configuration
 * Use this when your component uses SWR hooks that might make API calls
 *
 * @param component - React component to render
 * @param swrConfig - Optional SWR configuration overrides
 * @param renderOptions - Optional React Testing Library render options
 * @returns Render result with SWR context
 *
 * @example
 * ```typescript
 * import { renderWithSWR } from '@/__tests__/utils/test-utils';
 *
 * test('component renders correctly', () => {
 *   renderWithSWR(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export const renderWithSWR = (
  component: React.ReactElement,
  swrConfig = DEFAULT_SWR_CONFIG,
  renderOptions?: Omit<RenderOptions, "wrapper">
): RenderResult => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SWRConfig value={swrConfig}>{children}</SWRConfig>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Sets up fetch mock with default successful responses
 * Call this in beforeEach if your component makes direct fetch calls
 *
 * @example
 * ```typescript
 * import { setupFetchMock } from '@/__tests__/utils/test-utils';
 *
 * describe('MyComponent', () => {
 *   beforeEach(() => {
 *     setupFetchMock();
 *   });
 * });
 * ```
 */
export const setupFetchMock = () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
    status: 200,
    statusText: "OK"
  } as Response);
};

/**
 * Creates SWR configuration with custom fallback data
 * Useful when you need to provide specific mock data for your tests
 *
 * @param fallbackData - Object mapping API endpoints to mock data
 * @returns SWR configuration object
 *
 * @example
 * ```typescript
 * import { createSWRConfig, renderWithSWR } from '@/__tests__/utils/test-utils';
 *
 * const customConfig = createSWRConfig({
 *   '/api/v1/users': [{ id: 1, name: 'Test User' }]
 * });
 *
 * renderWithSWR(<UsersList />, customConfig);
 * ```
 */
export const createSWRConfig = (fallbackData: Record<string, unknown>) => ({
  provider: () => new Map(),
  dedupingInterval: 0,
  fallback: {
    ...DEFAULT_SWR_CONFIG.fallback,
    ...fallbackData
  }
});

/**
 * Clears all mocks - useful for test cleanup
 * Call this in afterEach or beforeEach
 */
export const clearAllMocks = () => {
  jest.clearAllMocks();

  // Reset fetch mock to default behavior
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    setupFetchMock();
  }
};

// Export common mock patterns
export const MOCK_RESPONSES = {
  EMPTY_ARRAY: [],
  EMPTY_OBJECT: {},
  SUCCESS_MESSAGE: { message: "Success" },
  ERROR_RESPONSE: { error: "Something went wrong" }
};
