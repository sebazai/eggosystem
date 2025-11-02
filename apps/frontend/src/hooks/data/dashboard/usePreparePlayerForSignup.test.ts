import { renderHook, act } from "@testing-library/react";
import { usePreparePlayerForSignup } from "./usePreparePlayerForSignup";

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("@/lib/utils", () => ({
  isValidSteamId: jest.fn(),
  convertSteamIdToSteamId64: jest.fn()
}));

import { clientApiFetch } from "@/lib/apiClient";
import { isValidSteamId, convertSteamIdToSteamId64 } from "@/lib/utils";

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockIsValidSteamId = isValidSteamId as jest.MockedFunction<
  typeof isValidSteamId
>;
const mockConvertSteamIdToSteamId64 =
  convertSteamIdToSteamId64 as jest.MockedFunction<
    typeof convertSteamIdToSteamId64
  >;

const mockPrepareResponse = {
  message: "Player prepared for signup successfully",
  account_id: 123,
  steam_id: "76561198012345678"
};

describe("usePreparePlayerForSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidSteamId.mockReturnValue(true);
    mockConvertSteamIdToSteamId64.mockImplementation(
      async (steamId: string) => steamId
    );
    mockClientApiFetch.mockClear();
  });

  describe("Initial State", () => {
    it("should return initial state correctly", () => {
      const { result } = renderHook(() => usePreparePlayerForSignup());

      expect(result.current).toBeDefined();
      expect(result.current.isPreparing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.preparePlayer).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("preparePlayer function", () => {
    it("should prepare player successfully", async () => {
      mockClientApiFetch.mockResolvedValueOnce(mockPrepareResponse);
      const { result } = renderHook(() => usePreparePlayerForSignup());

      let returnedResult;
      await act(async () => {
        returnedResult =
          await result.current.preparePlayer("76561198012345678");
      });

      expect(returnedResult).toEqual(mockPrepareResponse);
      expect(result.current.isPreparing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/players/76561198012345678/prepare-for-signup",
        {
          method: "POST"
        }
      );
    });

    it("should handle API errors", async () => {
      const errorMessage = "Player not found";
      mockClientApiFetch.mockRejectedValueOnce(new Error(errorMessage));
      const { result } = renderHook(() => usePreparePlayerForSignup());

      await act(async () => {
        await expect(async () => {
          await result.current.preparePlayer("76561198012345678");
        }).rejects.toThrow(errorMessage);
      });

      expect(result.current.isPreparing).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("should validate input fields", async () => {
      const { result } = renderHook(() => usePreparePlayerForSignup());

      // Test empty steamId
      await expect(async () => {
        await result.current.preparePlayer("");
      }).rejects.toThrow("Steam ID is required");

      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should validate Steam ID format", async () => {
      mockIsValidSteamId.mockReturnValue(false);
      const { result } = renderHook(() => usePreparePlayerForSignup());

      await expect(async () => {
        await result.current.preparePlayer("invalid-steam-id");
      }).rejects.toThrow("Invalid Steam ID format");

      expect(mockClientApiFetch).not.toHaveBeenCalled();
    });

    it("should set and clear loading state correctly", async () => {
      let resolvePromise: (
        value: typeof mockPrepareResponse
      ) => void = () => {};
      const promise = new Promise<typeof mockPrepareResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockClientApiFetch.mockReturnValueOnce(promise);
      const { result } = renderHook(() => usePreparePlayerForSignup());

      // Start preparation (async call)
      act(() => {
        result.current.preparePlayer("76561198012345678").catch(() => {
          // Ignore errors for this test
        });
      });

      // Wait for the conversion to complete and loading state to be set
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should be loading after conversion completes and API call starts
      expect(result.current.isPreparing).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise(mockPrepareResponse);
        await promise;
      });

      // Wait for preparation to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should not be loading after completion
      expect(result.current.isPreparing).toBe(false);
    });

    it("should convert Steam ID formats before calling API", async () => {
      const steamId3 = "[U:1:12345678]";
      const normalizedSteamId = "76561198012345678";

      mockConvertSteamIdToSteamId64.mockResolvedValueOnce(normalizedSteamId);
      mockClientApiFetch.mockResolvedValueOnce(mockPrepareResponse);
      const { result } = renderHook(() => usePreparePlayerForSignup());

      await act(async () => {
        await result.current.preparePlayer(steamId3);
      });

      expect(mockConvertSteamIdToSteamId64).toHaveBeenCalledWith(steamId3);
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        `/api/v1/dashboard/players/${normalizedSteamId}/prepare-for-signup`,
        {
          method: "POST"
        }
      );
    });
  });

  describe("clearError function", () => {
    it("should clear error state", async () => {
      const errorMessage = "Some error";
      mockClientApiFetch.mockRejectedValueOnce(new Error(errorMessage));
      const { result } = renderHook(() => usePreparePlayerForSignup());

      // Trigger an error
      await act(async () => {
        await expect(async () => {
          await result.current.preparePlayer("76561198012345678");
        }).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
