import { renderHook, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { usePlayerSeasonsContext } from "./usePlayerHistoricalData";
import { DEFAULT_PLAYER_SEASON_CONTEXT } from "@/lib/player-season-context";

jest.mock("swr");
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe("usePlayerSeasonsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch season context when steamId and context are provided", async () => {
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
      usePlayerSeasonsContext(
        "76561198012345678",
        DEFAULT_PLAYER_SEASON_CONTEXT
      )
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    expect(mockUseSWR).toHaveBeenCalledWith(
      "/api/v1/players/76561198012345678/seasons/context?organizer_id=1&app_id=730&gametype=comp",
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

    renderHook(() =>
      usePlayerSeasonsContext("", DEFAULT_PLAYER_SEASON_CONTEXT)
    );

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 5 * 60 * 1000
      })
    );
  });

  it("should not fetch when context is null", () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    renderHook(() => usePlayerSeasonsContext("76561198012345678", null));

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    );
  });
});
