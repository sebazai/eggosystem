import { render, screen, waitFor } from "@testing-library/react";
import { FilterProvider, useFilters } from "./FilterContext";
import useSWR from "swr";
import { useSearchParams, usePathname } from "next/navigation";

// Mock SWR
jest.mock("swr");
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

// Mock Next.js navigation
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  usePathname: jest.fn()
}));

// Test component that uses the filter context
const TestComponent = () => {
  const { filterParams, activeSeason, areFiltersEmpty, error, isLoading } =
    useFilters();

  return (
    <div>
      <div data-testid="ready">
        {!isLoading && filterParams ? "ready" : "not-ready"}
      </div>
      <div data-testid="active-season">{activeSeason?.season_id || "none"}</div>
      <div data-testid="filter-params">{JSON.stringify(filterParams)}</div>
      <div data-testid="filters-empty">
        {areFiltersEmpty ? "empty" : "not-empty"}
      </div>
      <div data-testid="error-message">{error?.message || "none"}</div>
    </div>
  );
};

describe("FilterContext", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/matches");

    // Mock window.history.replaceState
    Object.defineProperty(window, "history", {
      value: {
        replaceState: jest.fn()
      },
      writable: true
    });
  });

  it("should set ready to true when searchParams exist", async () => {
    const searchParams = new URLSearchParams("seasons=1&leagues=2");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("ready");
    });
  });

  it("should set ready to true when path is in excludePrefixPaths", async () => {
    mockUsePathname.mockReturnValue("/players/123");
    const searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("ready");
    });
  });

  it("should add season to URL when path is in includeExactPaths and no searchParams", async () => {
    mockUsePathname.mockReturnValue("/matches");
    const searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 5 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/matches?seasons=5"
      );
    });
  });

  it("should parse filter params from searchParams when ready", async () => {
    const searchParams = new URLSearchParams(
      "seasons=1&leagues=2&stages=3&teams=4&maps=5&playerName=test"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      const filterParamsText = screen.getByTestId("filter-params").textContent;
      const filterParams = JSON.parse(filterParamsText || "{}");
      expect(filterParams.seasons).toEqual([1]);
      expect(filterParams.leagues).toEqual([2]);
      expect(filterParams.stages).toEqual([3]);
      expect(filterParams.teams).toEqual([4]);
      expect(filterParams.maps).toEqual([5]);
      expect(filterParams.player_name).toBe("test");
    });
  });

  it("should indicate filters are empty when no filter params", async () => {
    const searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("filters-empty")).toHaveTextContent("empty");
    });
  });

  it("should indicate filters are not empty when filter params exist", async () => {
    const searchParams = new URLSearchParams("seasons=1");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("filters-empty")).toHaveTextContent(
        "not-empty"
      );
    });
  });

  it("should update ready state when searchParams change", async () => {
    const searchParams1 = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams1 as any);

    mockUseSWR.mockReturnValue({
      data: { season_id: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    const { rerender } = render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    // Initially should not be ready (empty searchParams on includeExactPath)
    await waitFor(() => {
      // Should add season to URL
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    // Change searchParams
    const searchParams2 = new URLSearchParams("seasons=1");
    mockUseSearchParams.mockReturnValue(searchParams2 as any);
    rerender(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("ready");
    });
  });

  it("should expose request errors instead of staying in loading state", async () => {
    mockUsePathname.mockReturnValue("/matches");
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as any);

    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error("Failed to load active season"),
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as any);

    render(
      <FilterProvider appId="1">
        <TestComponent />
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("ready");
    });

    expect(screen.getByTestId("active-season")).toHaveTextContent("none");
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Failed to load active season"
    );
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });
});
