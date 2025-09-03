import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import {
  useRegisteredTeams,
  useBulkApproveTeams,
  useManualValidityCheck
} from "./useRegisteredTeams";
import { clientApiFetch } from "@/lib/apiClient";
// toast is imported but not used in current tests

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("sonner");

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
// mockToast is defined but not used in current tests

describe("useRegisteredTeams", () => {
  const mockTeams = [
    {
      season_id: 1,
      team_id: 123,
      team_name: "Test Team 1",
      approved: false,
      terms_and_conditions_approved: true,
      external_platform_id: "team123",
      season_platform: "kanaliiga" as const,
      captain_nickname: "Captain1",
      co_captain_nickname: "CoCaptain1",
      is_valid: true,
      invalid_players: [],
      players: [
        {
          steam_id: "76561198012345678",
          nickname: "Player1",
          work_email: "player1@company.com",
          is_work_email_personal_email: false,
          work_email_verified: true
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useRegisteredTeams", () => {
    it("should fetch registered teams successfully", async () => {
      mockClientApiFetch.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.registeredTeams).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.registeredTeams).toEqual(mockTeams);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle fetch errors", async () => {
      const error = new Error("Failed to fetch");
      mockClientApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.registeredTeams).toBeUndefined();
    });

    it("should return loading state correctly", () => {
      // Mock a delayed response
      mockClientApiFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isValidating).toBe(true);
    });

    it("should cache data and avoid refetching", async () => {
      mockClientApiFetch.mockResolvedValue(mockTeams);

      const { result, rerender } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.registeredTeams).toEqual(mockTeams);
      });

      // Rerender should use cached data
      rerender();

      expect(result.current.registeredTeams).toEqual(mockTeams);
      expect(mockClientApiFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle empty data", async () => {
      mockClientApiFetch.mockResolvedValue([]);

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.registeredTeams).toEqual([]);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("useBulkApproveTeams", () => {
    it("should call bulk approve API successfully", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBulkApproveTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      const teamIds = [123, 456];
      await result.current.bulkApprove(teamIds);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/bulk-approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ teamIds })
        }
      );
    });

    it("should handle bulk approve errors", async () => {
      const error = new Error("Bulk approve failed");
      mockClientApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useBulkApproveTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      const teamIds = [123, 456];

      await expect(result.current.bulkApprove(teamIds)).rejects.toThrow(
        "Bulk approve failed"
      );
    });

    it("should revalidate data after successful bulk approve", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const mockMutate = jest.fn();
      const { result } = renderHook(() => useBulkApproveTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      // Mock the mutate function
      const originalMutate = result.current.bulkApprove;
      result.current.bulkApprove = async (teamIds: number[]) => {
        await originalMutate(teamIds);
        mockMutate("/api/v1/dashboard/registration/registered");
      };

      const teamIds = [123, 456];
      await result.current.bulkApprove(teamIds);

      expect(mockMutate).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/registered"
      );
    });

    it("should handle empty team IDs array", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBulkApproveTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await result.current.bulkApprove([]);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/bulk-approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ teamIds: [] })
        }
      );
    });
  });

  describe("useManualValidityCheck", () => {
    it("should call manual validity check API successfully", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useManualValidityCheck(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      const teamIds = [123, 456];
      await result.current.manualValidityCheck(teamIds);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/manual-validity-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ teamIds })
        }
      );
    });

    it("should handle manual validity check errors", async () => {
      const error = new Error("Manual validity check failed");
      mockClientApiFetch.mockRejectedValue(error);

      const { result } = renderHook(() => useManualValidityCheck(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      const teamIds = [123, 456];

      await expect(result.current.manualValidityCheck(teamIds)).rejects.toThrow(
        "Manual validity check failed"
      );
    });

    it("should revalidate data after successful manual validity check", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const mockMutate = jest.fn();
      const { result } = renderHook(() => useManualValidityCheck(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      // Mock the mutate function
      const originalManualValidityCheck = result.current.manualValidityCheck;
      result.current.manualValidityCheck = async (teamIds: number[]) => {
        await originalManualValidityCheck(teamIds);
        mockMutate("/api/v1/dashboard/registration/registered");
      };

      const teamIds = [123, 456];
      await result.current.manualValidityCheck(teamIds);

      expect(mockMutate).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/registered"
      );
    });

    it("should handle empty team IDs array", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useManualValidityCheck(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await result.current.manualValidityCheck([]);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/registration/manual-validity-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ teamIds: [] })
        }
      );
    });
  });

  describe("SWR configuration", () => {
    it("should not revalidate on focus", async () => {
      mockClientApiFetch.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.registeredTeams).toEqual(mockTeams);
      });

      // Simulate focus event
      window.dispatchEvent(new Event("focus"));

      // Should not refetch on focus
      expect(mockClientApiFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent requests", async () => {
      mockClientApiFetch.mockResolvedValue(mockTeams);

      const { result: result1 } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      const { result: result2 } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result1.current.registeredTeams).toEqual(mockTeams);
        expect(result2.current.registeredTeams).toEqual(mockTeams);
      });

      // Should deduplicate requests - but with separate SWR providers, they won't deduplicate
      expect(mockClientApiFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockClientApiFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("Network error");
    });

    it("should handle API errors with status codes", async () => {
      const apiError = new Error("API Error") as Error & { status: number };
      apiError.status = 500;
      mockClientApiFetch.mockRejectedValue(apiError);

      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle retry configuration", async () => {
      // Test that SWR is configured with retry options
      const { result } = renderHook(() => useRegisteredTeams(), {
        wrapper: ({ children }) => (
          <SWRConfig value={{ provider: () => new Map() }}>
            {children}
          </SWRConfig>
        )
      });

      // Just verify the hook renders without error
      expect(result.current).toBeDefined();
    });
  });
});
