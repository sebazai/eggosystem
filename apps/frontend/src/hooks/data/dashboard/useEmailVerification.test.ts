import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { useLookupAccount, useRegenerateToken } from "./useEmailVerification";
import { clientApiFetch } from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("useEmailVerification hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useLookupAccount", () => {
    const mockAccountData = {
      accountId: 1,
      steamId: "76561198012345678",
      nickname: "TestPlayer",
      workEmail: "test@example.com",
      workEmailVerified: false,
      workEmailToken: "token-123",
      workEmailTokenExpiresAt: new Date().toISOString(),
      isTokenValid: true,
      verificationUrl: "https://example.com/verify-email?token=token-123"
    };

    it("should initialize with default state", () => {
      const { result } = renderHook(() => useLookupAccount());

      expect(result.current.accountData).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should lookup account successfully", async () => {
      (clientApiFetch as jest.Mock).mockResolvedValue(mockAccountData);

      const { result } = renderHook(() => useLookupAccount());

      await act(async () => {
        await result.current.lookupAccount("76561198012345678", "steam_id");
      });

      await waitFor(() => {
        expect(result.current.accountData).toEqual(mockAccountData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(clientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/email-verification/lookup?lookup=76561198012345678&lookupType=steam_id"
      );
    });

    it("should handle lookup errors", async () => {
      const errorMessage = "Account not found";
      (clientApiFetch as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useLookupAccount());

      await act(async () => {
        await result.current.lookupAccount("nonexistent", "steam_id");
      });

      await waitFor(() => {
        expect(result.current.accountData).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it("should set error when lookup value is empty", async () => {
      const { result } = renderHook(() => useLookupAccount());

      await act(async () => {
        await result.current.lookupAccount("", "steam_id");
      });

      expect(result.current.error).toBe(
        "Please provide both a lookup value and type"
      );
      expect(clientApiFetch).not.toHaveBeenCalled();
    });

    it("should clear results", async () => {
      (clientApiFetch as jest.Mock).mockResolvedValue(mockAccountData);

      const { result } = renderHook(() => useLookupAccount());

      await act(async () => {
        await result.current.lookupAccount("76561198012345678", "steam_id");
      });

      await waitFor(() => {
        expect(result.current.accountData).toEqual(mockAccountData);
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.accountData).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should encode special characters in lookup value", async () => {
      (clientApiFetch as jest.Mock).mockResolvedValue(mockAccountData);

      const { result } = renderHook(() => useLookupAccount());

      await act(async () => {
        await result.current.lookupAccount("test@example.com", "email");
      });

      expect(clientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/email-verification/lookup?lookup=test%40example.com&lookupType=email"
      );
    });
  });

  describe("useRegenerateToken", () => {
    const mockRegenerateResponse = {
      success: true,
      token: "new-token-456",
      expiresAt: new Date().toISOString(),
      verificationUrl: "https://example.com/verify-email?token=new-token-456"
    };

    it("should initialize with default state", () => {
      const { result } = renderHook(() => useRegenerateToken());

      expect(result.current.regeneratedData).toBeNull();
      expect(result.current.isRegenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should regenerate token successfully", async () => {
      (clientApiFetch as jest.Mock).mockResolvedValue(mockRegenerateResponse);

      const { result } = renderHook(() => useRegenerateToken());

      await act(async () => {
        await result.current.regenerateToken(1);
      });

      await waitFor(() => {
        expect(result.current.regeneratedData).toEqual(mockRegenerateResponse);
        expect(result.current.isRegenerating).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(clientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/email-verification/regenerate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ accountId: 1 })
        }
      );
    });

    it("should handle regeneration errors", async () => {
      const errorMessage = "Account email is already verified";
      (clientApiFetch as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRegenerateToken());

      await act(async () => {
        try {
          await result.current.regenerateToken(1);
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.regeneratedData).toBeNull();
        expect(result.current.isRegenerating).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it("should set error when accountId is missing", async () => {
      const { result } = renderHook(() => useRegenerateToken());

      await act(async () => {
        await result.current.regenerateToken(0);
      });

      expect(result.current.error).toBe("Account ID is required");
      expect(clientApiFetch).not.toHaveBeenCalled();
    });

    it("should clear regenerated data", async () => {
      (clientApiFetch as jest.Mock).mockResolvedValue(mockRegenerateResponse);

      const { result } = renderHook(() => useRegenerateToken());

      await act(async () => {
        await result.current.regenerateToken(1);
      });

      await waitFor(() => {
        expect(result.current.regeneratedData).toEqual(mockRegenerateResponse);
      });

      act(() => {
        result.current.clearRegeneratedData();
      });

      expect(result.current.regeneratedData).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should throw error on failure", async () => {
      const errorMessage = "Work email not found";
      (clientApiFetch as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRegenerateToken());

      await expect(
        act(async () => {
          await result.current.regenerateToken(1);
        })
      ).rejects.toThrow();
    });
  });
});
