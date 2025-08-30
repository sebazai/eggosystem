import { renderHook, act } from "@testing-library/react";
import { usePlayerValidation } from "./usePlayerValidation";
import { SeasonPlatform } from "@eggosystem/types";
import type { PlayerValidationResult } from "@eggosystem/types";

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("@/lib/utils");
jest.mock("swr");

import { isValidSteamId } from "@/lib/utils";
import useSWR, { type SWRResponse } from "swr";

const mockIsValidSteamId = isValidSteamId as jest.MockedFunction<
  typeof isValidSteamId
>;
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

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
      nickname: "TestPlayer",
      discord: "TestPlayer#1234",
      work_email_verified: true,
      is_valid_full_name: true,
      is_valid_work_email: true
    },
    error: null
  },
  overall_success: true
};

describe("usePlayerValidation", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidSteamId.mockReturnValue(true);

    // Reset mockMutate to default implementation
    mockMutate.mockImplementation(() => Promise.resolve());

    // Mock SWR with default state
    mockUseSWR.mockReturnValue({
      data: null,
      error: null,
      isValidating: false,
      mutate: mockMutate,
      isLoading: false
    } as SWRResponse);
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
      mockMutate.mockResolvedValueOnce(mockValidationResult);
      const { result } = renderHook(() => usePlayerValidation());

      let returnedResult;
      await act(async () => {
        returnedResult = await result.current.validatePlayer(
          "76561198012345678",
          "1"
        );
      });

      expect(returnedResult).toEqual(mockValidationResult);
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors", async () => {
      const errorMessage = "Player not found";
      const { result } = renderHook(() => usePlayerValidation());

      // Mock the mutate function to reject when called for this test only
      mockMutate.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await result.current.validatePlayer("76561198012345678", "1");
      }).rejects.toThrow(errorMessage);
    });

    it("should validate input fields", async () => {
      const { result } = renderHook(() => usePlayerValidation());

      // Test empty steamId
      await expect(async () => {
        await result.current.validatePlayer("", "1");
      }).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      expect(mockMutate).not.toHaveBeenCalled();

      // Test empty seasonId
      await expect(async () => {
        await result.current.validatePlayer("76561198012345678", "");
      }).rejects.toThrow(
        "All fields are required. Please select a season first."
      );

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should validate Steam ID format", async () => {
      mockIsValidSteamId.mockReturnValue(false);
      const { result } = renderHook(() => usePlayerValidation());

      await expect(async () => {
        await result.current.validatePlayer("invalid-steam-id", "1");
      }).rejects.toThrow("Invalid Steam ID format");

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe("clearResults function", () => {
    it("should clear validation results and errors", () => {
      const { result } = renderHook(() => usePlayerValidation());

      // Test that clearResults calls mutate with undefined
      act(() => {
        result.current.clearResults();
      });

      expect(mockMutate).toHaveBeenCalledWith(undefined, false);
    });
  });
});
