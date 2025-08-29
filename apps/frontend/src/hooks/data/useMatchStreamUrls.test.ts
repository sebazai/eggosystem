import { renderHook, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { useMatchStreamUrls } from "./useMatchStreamUrls";

// Mock SWR
jest.mock("swr");
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe("useMatchStreamUrls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return stream URLs when match ID is provided", async () => {
    const mockData = {
      streamUrls: ["https://twitch.tv/caster1", "https://twitch.tv/caster2"]
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(123));

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([
        "https://twitch.tv/caster1",
        "https://twitch.tv/caster2"
      ]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    expect(mockUseSWR).toHaveBeenCalledWith(
      "/api/v1/matches/123/streams",
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000
      })
    );
  });

  it("should return empty stream URLs when no data", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(123));

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it("should return empty stream URLs when response has empty array", async () => {
    const mockData = {
      streamUrls: []
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(123));

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it("should handle loading state", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(123));

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });
  });

  it("should handle error state", async () => {
    const mockError = new Error("API Error");

    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(123));

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });
  });

  it("should not make request when match ID is undefined", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    });

    const { result } = renderHook(() => useMatchStreamUrls(undefined));

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000
      })
    );

    await waitFor(() => {
      expect(result.current.streamUrls).toEqual([]);
    });
  });
});
