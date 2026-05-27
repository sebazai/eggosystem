import { fireEvent, render, screen } from "@testing-library/react";
import { FilterBarDesktop } from "./FilterBarDesktop";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";

jest.mock("@/hooks/data/useMultiFilterSelectables");

const mockRefresh = jest.fn();
const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => "/matches"
}));

const mockSwr = jest.fn();
jest.mock("swr", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockSwr(...args)
}));

const mockUseMultiFilterSelectables =
  useMultiFilterSelectables as jest.MockedFunction<
    typeof useMultiFilterSelectables
  >;

const defaultFilterParams = {
  seasons: [],
  leagues: [],
  stages: null,
  teams: null,
  maps: null
};

describe("FilterBarDesktop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    Object.defineProperty(window, "history", {
      value: { replaceState: jest.fn() },
      writable: true
    });

    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: {
        season_ids: [],
        league_ids: [],
        stages: [],
        team_ids: [],
        map_ids: []
      },
      isValidating: false,
      isError: false,
      isLoading: false
    });

    mockSwr.mockImplementation((key: string) => {
      if (key === "/api/v1/seasons") {
        return { data: [{ id: 1, full_name: "Season 12" }] };
      }
      if (key === "/api/v1/leagues") {
        return { data: [{ id: 1, name: "CS2 Masters", sort_priority: 1 }] };
      }
      if (key === "/api/v1/stages") {
        return { data: [{ id: 1, name: "Regular Season" }] };
      }
      if (key === "/api/v1/teams") {
        return { data: [{ id: 1, name: "Team Alpha" }] };
      }
      if (key === "/api/v1/maps") {
        return { data: [{ id: 1, name: "de_mirage" }] };
      }
      return { data: undefined };
    });
  });

  it("renders facet filter controls without a sort control", () => {
    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    expect(screen.getByRole("button", { name: "Seasons" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leagues" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Teams" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maps" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sort matches" })
    ).not.toBeInTheDocument();
  });

  it("clears all filter params when Clear all is clicked", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("leagues=1&sort=oldest")
    );

    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(mockReplace).toHaveBeenCalledWith("/matches");
  });
});
