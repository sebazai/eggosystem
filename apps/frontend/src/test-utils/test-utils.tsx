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
import type { UserFullPayload } from "@eggosystem/types";

// Create a mock AuthContext for testing
const MockAuthContext = React.createContext<{
  user: UserFullPayload | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: false,
  checkAuth: jest.fn(),
  logout: jest.fn()
});

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
export function renderWithSWR(
  component: React.ReactElement,
  swrConfig: typeof DEFAULT_SWR_CONFIG = DEFAULT_SWR_CONFIG,
  renderOptions?: Omit<RenderOptions, "wrapper">
): RenderResult {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SWRConfig value={swrConfig}>{children}</SWRConfig>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
}

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

// =============================================================================
// AUTH CONTEXT TESTING UTILITIES
// =============================================================================

/**
 * Mock user data for testing auth scenarios
 */
export const createMockUser = (overrides = {}): UserFullPayload => ({
  account_id: 1,
  provider_id: "76561198012345678",
  roles: ["user"],
  nickname: "testuser",
  provider: "steam",
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  acceptedNewsletter: true,
  isPersonalEmail: true,
  discordLinked: false,
  ...overrides
});

/**
 * Mock AuthContext provider for testing
 * Provides a consistent auth context without requiring actual auth setup
 */
export const MockAuthProvider: React.FC<{
  children: React.ReactNode;
  user?: UserFullPayload | null;
  isLoading?: boolean;
}> = ({ children, user = createMockUser(), isLoading = false }) => {
  const mockAuthValue = {
    user,
    loading: isLoading,
    checkAuth: jest.fn(),
    logout: jest.fn()
  };

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Mock WithRoleProtection component for testing
 * Bypasses role checking for easier testing of protected components
 */
export const MockWithRoleProtection: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Comprehensive test wrapper that includes SWR, Auth, and other providers
 * Use this for testing dashboard/admin components that require auth
 */
interface TestWrapperOptions extends RenderOptions {
  swrConfig?: typeof DEFAULT_SWR_CONFIG;
  user?: UserFullPayload | null;
  isAuthLoading?: boolean;
}

export function renderWithAuthAndSWR(
  ui: React.ReactElement,
  {
    swrConfig = DEFAULT_SWR_CONFIG,
    user = createMockUser(),
    isAuthLoading = false,
    ...renderOptions
  }: TestWrapperOptions = {}
): RenderResult {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockAuthProvider user={user} isLoading={isAuthLoading}>
      <SWRConfig value={swrConfig}>{children}</SWRConfig>
    </MockAuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Simple wrapper for components that need auth context but not SWR
 */
export function renderWithAuth(
  ui: React.ReactElement,
  {
    user = createMockUser(),
    isAuthLoading = false,
    ...renderOptions
  }: {
    user?: UserFullPayload | null;
    isAuthLoading?: boolean;
  } & RenderOptions = {}
): RenderResult {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockAuthProvider user={user} isLoading={isAuthLoading}>
      {children}
    </MockAuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
