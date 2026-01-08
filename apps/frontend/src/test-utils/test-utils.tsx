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

// =============================================================================
// AUTH CONTEXT MOCKING
// =============================================================================

/**
 * Global mock auth state that can be controlled in tests
 * This is used by the mocked useAuth hook
 */
let mockAuthState = {
  user: null as UserFullPayload | null,
  loading: false,
  checkAuth: jest.fn(),
  logout: jest.fn()
};

/**
 * Sets the mock auth state for tests
 * Call this in your tests to control what useAuth returns
 */
export const setMockAuthState = (state: Partial<typeof mockAuthState>) => {
  mockAuthState = { ...mockAuthState, ...state };
};

/**
 * Resets the mock auth state to defaults
 * Call this in beforeEach to ensure clean state
 */
export const resetMockAuthState = () => {
  mockAuthState = {
    user: null,
    loading: false,
    checkAuth: jest.fn(),
    logout: jest.fn()
  };
};

/**
 * Gets the current mock auth state
 * This is used internally by the mocked useAuth hook
 */
export const getMockAuthState = () => mockAuthState;

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
  isPersonalEmail: true,
  discordLinked: false,
  ...overrides
});

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
 * Comprehensive test wrapper that includes SWR and sets up auth mocking
 * Use this for testing components that use useAuth and SWR
 *
 * IMPORTANT: Before using this, you must mock useAuth in your test file.
 * See .cursor/rules/testing.mdc for complete setup instructions.
 *
 * @param ui - React component to render
 * @param options - Render options including user, loading state, and SWR config
 *
 * @example
 * ```typescript
 * renderWithAuthAndSWR(<MyComponent />, {
 *   user: createMockUser({ roles: ['admin'] })
 * });
 * ```
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
  // Set the mock auth state before rendering
  setMockAuthState({
    user,
    loading: isAuthLoading,
    checkAuth: jest.fn(),
    logout: jest.fn()
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SWRConfig value={swrConfig}>{children}</SWRConfig>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Simple wrapper for components that need auth but not SWR
 *
 * IMPORTANT: Before using this, you must mock useAuth in your test file.
 * See .cursor/rules/testing.mdc for complete setup instructions.
 *
 * @param ui - React component to render
 * @param options - Render options including user and loading state
 *
 * @example
 * ```typescript
 * renderWithAuth(<MyComponent />, {
 *   user: createMockUser({ roles: ['admin'] })
 * });
 * ```
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
  // Set the mock auth state before rendering
  setMockAuthState({
    user,
    loading: isAuthLoading,
    checkAuth: jest.fn(),
    logout: jest.fn()
  });

  return render(ui, renderOptions);
}
