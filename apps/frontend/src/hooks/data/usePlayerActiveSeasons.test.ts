import { renderHook, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { usePlayerActiveSeasons } from "./usePlayerHistoricalData";

jest.mock("swr");
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe("usePlayerActiveSeasons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch active seasons when steamId is provided", async () => {
    const mockData = {
      current_season: {
        season_id: 123,
        full_name: "Spring 2025",
        start_date: "2025-03-01",
        end_date: null
      },
      last_season: null
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() =>
      usePlayerActiveSeasons("76561198012345678")
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    expect(mockUseSWR).toHaveBeenCalledWith(
      "/api/v1/players/76561198012345678/seasons/active",
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 5 * 60 * 1000
      })
    );
  });

  it("should not fetch when steamId is empty", () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    renderHook(() => usePlayerActiveSeasons(""));

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 5 * 60 * 1000
      })
    );
  });
});
