import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import {
  setAuthFailureCallback,
  clientApiFetch,
  refreshAccessToken
} from "@/lib/apiClient";
import type { UserFullPayload } from "@eggosystem/types";

// Mock the apiClient functions
jest.mock("@/lib/apiClient", () => {
  const actual = jest.requireActual("@/lib/apiClient");
  return {
    ...actual,
    clientApiFetch: jest.fn(),
    setAuthFailureCallback: jest.fn(),
    markValidSession: jest.fn(),
    clearSessionState: jest.fn()
  };
});

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, checkAuth, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? "logged-in" : "no-user"}</div>
      <div data-testid="loading">{loading ? "loading" : "not-loading"}</div>
      <button onClick={checkAuth} data-testid="check-auth">
        Check Auth
      </button>
      <button onClick={logout} data-testid="logout">
        Logout
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register auth failure callback", async () => {
    const mockSetAuthFailureCallback = setAuthFailureCallback as jest.Mock;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the auth failure callback to be set
    await waitFor(() => {
      expect(mockSetAuthFailureCallback).toHaveBeenCalled();
    });

    // Verify that a function was passed as the callback
    expect(mockSetAuthFailureCallback.mock.calls[0][0]).toBeInstanceOf(
      Function
    );
  });

  it("should handle auth failure callback correctly", async () => {
    const mockSetAuthFailureCallback = setAuthFailureCallback as jest.Mock;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the auth failure callback to be set
    await waitFor(() => {
      expect(mockSetAuthFailureCallback).toHaveBeenCalled();
    });

    // Get the callback function that was passed to setAuthFailureCallback
    const authFailureCallback = mockSetAuthFailureCallback.mock.calls[0][0];

    // Simulate auth failure
    authFailureCallback();

    // Verify the callback behavior
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  describe("Token refresh on mount", () => {
    const mockUser: UserFullPayload = {
      account_id: 1,
      provider_id: "123",
      roles: ["player"],
      nickname: "testuser",
      provider: "steam",
      acceptedPrivacyPolicy: true,
      acceptedMarketing: false,
      isPersonalEmail: false,
      discordLinked: false
    };

    beforeEach(() => {
      // Mock fetch for refreshAccessToken
      global.fetch = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should call refreshAccessToken when checkAuth runs on mount", async () => {
      const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
        typeof clientApiFetch
      >;
      mockClientApiFetch.mockResolvedValue({ user: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for checkAuth to complete
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });

      // Verify refreshAccessToken was called (indirectly via fetch to refresh endpoint)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/refresh"),
        expect.objectContaining({
          method: "POST",
          credentials: "include"
        })
      );

      // Verify user data was fetched after refresh
      expect(mockClientApiFetch).toHaveBeenCalledWith("/api/v1/auth/me");
      expect(screen.getByTestId("user")).toHaveTextContent("logged-in");
    });

    it("should notify refreshSubscribers when token refresh succeeds", async () => {
      const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
        typeof clientApiFetch
      >;
      mockClientApiFetch.mockResolvedValue({ user: mockUser });

      // Track fetch calls to verify only one refresh request is made
      let fetchCallCount = 0;
      const resolveFunctions: Array<(value: Response) => void> = [];

      // Mock fetch to simulate a delayed refresh response
      (global.fetch as jest.Mock).mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          // First call - return a promise that we can control
          return new Promise<Response>((resolve) => {
            resolveFunctions.push(resolve);
          });
        }
        return Promise.reject(new Error("Unexpected fetch call"));
      });

      // Test the subscriber mechanism by calling refreshAccessToken twice simultaneously
      // The second call should subscribe and wait for the first to complete
      const firstRefreshPromise = refreshAccessToken();
      const secondRefreshPromise = refreshAccessToken(); // This should subscribe to the first

      // Verify only one fetch call was made (second call should subscribe, not make a new request)
      expect(fetchCallCount).toBe(1);

      // Track when subscribers are called
      let subscriberCalled = false;
      const subscriberPromise = new Promise<void>((resolve) => {
        // The second refresh should resolve when the first completes
        secondRefreshPromise.then(() => {
          subscriberCalled = true;
          resolve();
        });
      });

      // Resolve the first fetch (this should trigger onTokenRefreshed and notify subscribers)
      const resolveFn = resolveFunctions[0];
      if (resolveFn) {
        resolveFn({
          ok: true,
          status: 200
        } as Response);
      }

      // Wait for both promises to resolve
      await Promise.all([firstRefreshPromise, subscriberPromise]);

      // Verify that the subscriber was notified (second promise resolved)
      expect(subscriberCalled).toBe(true);

      // Verify only one fetch call was made (proving the second call subscribed instead)
      expect(fetchCallCount).toBe(1);
    });

    it("should handle refresh failure gracefully and still fetch user data", async () => {
      const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
        typeof clientApiFetch
      >;
      mockClientApiFetch.mockResolvedValue({ user: mockUser });

      // Mock fetch to return an error for refresh
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Refresh failed")
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for checkAuth to complete (should handle refresh error and still fetch user)
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });

      // Verify user data was still fetched even though refresh failed
      expect(mockClientApiFetch).toHaveBeenCalledWith("/api/v1/auth/me");
      expect(screen.getByTestId("user")).toHaveTextContent("logged-in");
    });
  });
});
