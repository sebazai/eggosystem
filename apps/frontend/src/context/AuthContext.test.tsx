import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { setAuthFailureCallback } from "@/lib/apiClient";

// Mock the apiClient functions
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn(),
  setAuthFailureCallback: jest.fn()
}));

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
});
