/**
 * Integration tests for usePlayerValidation hook
 * These tests verify the hook's behavior with real API interactions
 * but using mocked fetch responses to ensure predictable results
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { usePlayerValidation } from "./usePlayerValidation";
import {
  EligiblePlayerForValidationSteamId,
  IneligiblePlayerForValidationSteamId,
  SeasonPlatform,
  type PlayerValidationResult
} from "@eggosystem/types";

// Mock clientApiFetch
const mockClientApiFetch = jest.fn();
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: (url: string) => mockClientApiFetch(url)
}));

// Mock isValidSteamId and convertSteamIdToSteamId64 utilities
jest.mock("@/lib/utils", () => ({
  isValidSteamId: jest.fn((steamId: string) => {
    // Simple validation: should be a string of 17 digits
    return /^\d{17}$/.test(steamId);
  }),
  convertSteamIdToSteamId64: jest.fn(async (steamId: string) => {
    // If already valid SteamID64, return as-is
    if (/^\d{17}$/.test(steamId)) {
      return steamId;
    }
    // For testing, just return the input as-is (conversion logic tested elsewhere)
    return steamId;
  })
}));

describe("usePlayerValidation Integration Tests", () => {
  const mockSuccessfulValidation: PlayerValidationResult = {
    steam_id: EligiblePlayerForValidationSteamId,
    season_id: 14,
    app_id: 730,
    platform: SeasonPlatform.FACEIT,
    hours: {
      value: 1500,
      success: true,
      error: null
    },
    rank: {
      value: 15000,
      success: true,
      error: null
    },
    platform_rank: {
      value: 5,
      success: true,
      error: null
    },
    profile: {
      success: true,
      data: {
        account_id: 123,
        steam_id: "76561197960287930",
        nickname: "TestPlayer",
        discord: "player#1234",
        discord_linked: true,
        work_email_verified: true,
        is_work_email_personal_email: false,
        is_valid_full_name: true,
        is_valid_work_email: true,
        work_email: "test@example.com"
      },
      error: null
    },
    overall_success: true
  };

  const mockFailedValidation: PlayerValidationResult = {
    steam_id: EligiblePlayerForValidationSteamId,
    season_id: 14,
    app_id: 730,
    platform: SeasonPlatform.FACEIT,
    hours: {
      value: -1,
      success: false,
      error: "Insufficient hours detected"
    },
    rank: {
      value: -1,
      success: false,
      error: "CS2 rank could not be determined"
    },
    platform_rank: {
      value: -1,
      success: false,
      error: "No FaceIT rank found"
    },
    profile: {
      success: false,
      data: null,
      error: "Player not found in Kanahub"
    },
    overall_success: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial state correctly", () => {
      const { result } = renderHook(() => usePlayerValidation());

      expect(result.current.validationResult).toBeNull();
      expect(result.current.isValidating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.validatePlayer).toBe("function");
      expect(typeof result.current.clearResults).toBe("function");
    });
  });

  describe("Successful Validation", () => {
    it("should validate player successfully", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      // Trigger validation
      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      await waitFor(() => {
        expect(result.current.validationResult).toEqual(
          mockSuccessfulValidation
        );
        expect(result.current.isValidating).toBe(false);
        expect(result.current.error).toBeNull();
      });

      // Verify API was called with correct URL
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/players/76561198054765387/validate?season_id=14"
      );
    });

    it("should handle validation result with overall_success true", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      await waitFor(() => {
        expect(result.current.validationResult?.overall_success).toBe(true);
        expect(result.current.validationResult?.hours.success).toBe(true);
        expect(result.current.validationResult?.rank.success).toBe(true);
        expect(result.current.validationResult?.platform_rank.success).toBe(
          true
        );
        expect(result.current.validationResult?.profile.success).toBe(true);
      });
    });
  });

  describe("Failed Validation", () => {
    it("should handle validation failure", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockFailedValidation);

      const { result } = renderHook(() => usePlayerValidation());

      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      await waitFor(() => {
        expect(result.current.validationResult).toEqual(mockFailedValidation);
        expect(result.current.validationResult?.overall_success).toBe(false);
        expect(result.current.isValidating).toBe(false);
      });
    });

    it("should handle individual validation failures", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockFailedValidation);

      const { result } = renderHook(() => usePlayerValidation());

      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      await waitFor(() => {
        expect(result.current.validationResult?.hours.success).toBe(false);
        expect(result.current.validationResult?.hours.error).toBe(
          "Insufficient hours detected"
        );
        expect(result.current.validationResult?.rank.success).toBe(false);
        expect(result.current.validationResult?.rank.error).toBe(
          "CS2 rank could not be determined"
        );
        expect(result.current.validationResult?.platform_rank.success).toBe(
          false
        );
        expect(result.current.validationResult?.platform_rank.error).toBe(
          "No FaceIT rank found"
        );
        expect(result.current.validationResult?.profile.success).toBe(false);
        expect(result.current.validationResult?.profile.error).toBe(
          "Player not found in Kanahub"
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API network errors", async () => {
      const networkError = new Error("Network error");
      mockClientApiFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => usePlayerValidation());

      await expect(
        result.current.validatePlayer(EligiblePlayerForValidationSteamId, "14")
      ).rejects.toThrow("Network error");
    });

    it("should handle invalid Steam ID", async () => {
      const { result } = renderHook(() => usePlayerValidation());

      await expect(
        result.current.validatePlayer("invalid-steam-id", "14")
      ).rejects.toThrow("Invalid Steam ID format");

      // Should not call API for invalid Steam ID
      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should handle missing required fields", async () => {
      const { result } = renderHook(() => usePlayerValidation());

      // Missing steamId
      await expect(result.current.validatePlayer("", "14")).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      // Missing seasonId
      await expect(
        result.current.validatePlayer(EligiblePlayerForValidationSteamId, "")
      ).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      // Should not call API for missing fields
      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should handle API errors with error messages", async () => {
      const apiError = new Error("Player not found");
      apiError.message = "Player not found";
      mockClientApiFetch.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => usePlayerValidation());

      await expect(
        result.current.validatePlayer(EligiblePlayerForValidationSteamId, "14")
      ).rejects.toThrow("Player not found");
    });
  });

  describe("Loading States", () => {
    it("should set isValidating to true during validation", async () => {
      // Create a promise that we can control
      let resolveValidation: (value: PlayerValidationResult) => void;
      const validationPromise = new Promise<PlayerValidationResult>(
        (resolve) => {
          resolveValidation = resolve;
        }
      );

      mockClientApiFetch.mockReturnValueOnce(validationPromise);

      const { result } = renderHook(() => usePlayerValidation());

      // Start validation
      const validationCall = result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      // Should be validating
      await waitFor(() => {
        expect(result.current.isValidating).toBe(true);
      });

      // Resolve the validation
      resolveValidation!(mockSuccessfulValidation);
      await validationCall;

      // Should no longer be validating
      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });
    });
  });

  describe("Clear Results", () => {
    it("should clear validation results", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      // First validate
      await act(async () => {
        await result.current.validatePlayer(
          EligiblePlayerForValidationSteamId,
          "14"
        );
      });

      expect(result.current.validationResult).toEqual(mockSuccessfulValidation);

      // Then clear results
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.validationResult).toBeNull();
    });
  });

  describe("URL Construction", () => {
    it("should construct correct API URL with season_id parameter", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/players/76561198054765387/validate?season_id=14"
      );
    });

    it("should handle different Steam IDs and season IDs", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      await result.current.validatePlayer(
        IneligiblePlayerForValidationSteamId,
        "13"
      );

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/players/76561197960383236/validate?season_id=13"
      );
    });
  });

  describe("Caching Behavior", () => {
    it("should not automatically fetch on mount", () => {
      renderHook(() => usePlayerValidation());

      // Should not call API automatically
      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should allow manual validation triggering", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockSuccessfulValidation);

      const { result } = renderHook(() => usePlayerValidation());

      // Manual validation
      await result.current.validatePlayer(
        EligiblePlayerForValidationSteamId,
        "14"
      );

      expect(mockClientApiFetch).toHaveBeenCalledTimes(1);
    });
  });
});
