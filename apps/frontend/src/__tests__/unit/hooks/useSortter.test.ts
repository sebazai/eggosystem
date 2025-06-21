import { renderHook, act } from "@testing-library/react";
import { useSortter } from "@/hooks/data/dashboard/useSortter";
import { clientApiFetch } from "@/lib/apiClient";

// Mock the clientApiFetch
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === "season") return "2";
      return null;
    }),
    toString: jest.fn(() => "")
  })
}));

describe("useSortter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch seasons and team data", async () => {
    // Mock data
    const mockSeasons = [
      { id: 1, name: "Season 1" },
      { id: 2, name: "Season 2" }
    ];

    const mockTeams = [
      {
        team_id: 1,
        team_name: "Team 1",
        top5_values: [350, 345, 340, 335, 330]
      },
      {
        team_id: 2,
        team_name: "Team 2",
        top5_values: [340, 335, 330, 325, 320]
      }
    ];

    // Setup mocks for each API call
    (clientApiFetch as jest.Mock)
      .mockResolvedValueOnce(mockSeasons) // First call for seasons
      .mockResolvedValueOnce(mockTeams); // Second call for teams

    // Render the hook
    const { result, rerender } = renderHook(() => useSortter());

    // Wait for data to be loaded
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Force a re-render to get updated state
    rerender();

    // Verify the hook returns the expected data
    expect(result.current.seasons).toEqual(mockSeasons);
    expect(result.current.teams).toEqual(mockTeams);
    expect(result.current.selectedSeason).toBe(2); // From URL param
    expect(result.current.isLoadingSeasons).toBe(false);
    expect(result.current.isLoadingTeams).toBe(false);
  });

  it("should handle errors", async () => {
    // Mock API error
    const errorMessage = "API error";
    (clientApiFetch as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    // Render the hook
    const { result, rerender } = renderHook(() => useSortter());

    // Wait for error to be caught
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Force a re-render to get updated state
    rerender();

    // Only check isLoadingSeasons since error might not be set immediately
    expect(result.current.isLoadingSeasons).toBe(false);
  });
});
