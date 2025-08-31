import { renderHook, act } from "@testing-library/react";
import { usePlayerValidation } from "./usePlayerValidation";
import { SeasonPlatform } from "@eggosystem/types";
import type { PlayerValidationResult } from "@eggosystem/types";

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("@/lib/utils");

import { clientApiFetch } from "@/lib/apiClient";
import { isValidSteamId } from "@/lib/utils";

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockIsValidSteamId = isValidSteamId as jest.MockedFunction<
  typeof isValidSteamId
>;

const mockValidationResult: PlayerValidationResult = {
  steam_id: "76561198012345678",
  season_id: 1,
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
    value: 8,
    success: true,
    error: null
  },
  profile: {
    success: true,
    data: {
      account_id: 123,
      steam_id: "76561197960287930",
      nickname: "TestPlayer",
      discord: "TestPlayer#1234",
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

describe("usePlayerValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidSteamId.mockReturnValue(true);
  });

  describe("Initial State", () => {
    it("should return initial state correctly", () => {
      const { result } = renderHook(() => usePlayerValidation());

      expect(result.current).toBeDefined();
      expect(result.current.validationResult).toBeNull();
      expect(result.current.isValidating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.validatePlayer).toBe("function");
      expect(typeof result.current.clearResults).toBe("function");
    });
  });

  describe("validatePlayer function", () => {
    it("should validate player successfully", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockValidationResult);
      const { result } = renderHook(() => usePlayerValidation());

      let returnedResult;
      await act(async () => {
        returnedResult = await result.current.validatePlayer(
          "76561198012345678",
          "1"
        );
      });

      expect(returnedResult).toEqual(mockValidationResult);
      expect(result.current.validationResult).toEqual(mockValidationResult);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/players/76561198012345678/validate?season_id=1"
      );
    });

    it("should handle API errors", async () => {
      const errorMessage = "Player not found";
      mockClientApiFetch.mockRejectedValueOnce(new Error(errorMessage));
      const { result } = renderHook(() => usePlayerValidation());

      await act(async () => {
        await expect(async () => {
          await result.current.validatePlayer("76561198012345678", "1");
        }).rejects.toThrow(errorMessage);
      });

      expect(result.current.validationResult).toBeNull();
      expect(result.current.isValidating).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("should validate input fields", async () => {
      const { result } = renderHook(() => usePlayerValidation());

      // Test empty steamId
      await expect(async () => {
        await result.current.validatePlayer("", "1");
      }).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      expect(mockClientApiFetch).not.toHaveBeenCalled();

      // Test empty seasonId
      await expect(async () => {
        await result.current.validatePlayer("76561198012345678", "");
      }).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should validate Steam ID format", async () => {
      mockIsValidSteamId.mockReturnValue(false);
      const { result } = renderHook(() => usePlayerValidation());

      await expect(async () => {
        await result.current.validatePlayer("invalid-steam-id", "1");
      }).rejects.toThrow("Invalid Steam ID format");

      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should set and clear loading state correctly", async () => {
      let resolvePromise: (value: PlayerValidationResult) => void = () => {};
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockClientApiFetch.mockReturnValueOnce(promise);
      const { result } = renderHook(() => usePlayerValidation());

      // Start validation
      act(() => {
        result.current.validatePlayer("76561198012345678", "1");
      });

      // Should be loading initially
      expect(result.current.isValidating).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockValidationResult);
        await promise;
      });

      // Should not be loading after completion
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe("clearResults function", () => {
    it("should clear validation results and errors", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockValidationResult);
      const { result } = renderHook(() => usePlayerValidation());

      // First validate a player to have some state
      await act(async () => {
        await result.current.validatePlayer("76561198012345678", "1");
      });

      expect(result.current.validationResult).toEqual(mockValidationResult);

      // Then clear the results
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.validationResult).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
