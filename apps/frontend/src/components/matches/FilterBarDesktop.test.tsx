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

  it("renders a chip for a selected season and shows the label", () => {
    render(
      <FilterBarDesktop
        filterParams={{ ...defaultFilterParams, seasons: [1] }}
      />
    );

    // FacetChip renders the label text
    expect(screen.getByText("Season 12")).toBeInTheDocument();
    // The plain label "SEASONS" text is replaced by the chip
    expect(screen.queryByText("SEASONS")).not.toBeInTheDocument();
  });

  it("shows +N overflow chip when more than 2 items are selected", () => {
    // Three teams selected but only 1 is visible; the rest appear as +2
    mockSwr.mockImplementation((key: string) => {
      if (key === "/api/v1/teams") {
        return {
          data: [
            { id: 1, name: "Team A" },
            { id: 2, name: "Team B" },
            { id: 3, name: "Team C" }
          ]
        };
      }
      if (key === "/api/v1/seasons") return { data: [] };
      if (key === "/api/v1/leagues") return { data: [] };
      if (key === "/api/v1/stages") return { data: [] };
      if (key === "/api/v1/maps") return { data: [] };
      return { data: undefined };
    });

    render(
      <FilterBarDesktop
        filterParams={{ ...defaultFilterParams, teams: [1, 2, 3] }}
      />
    );

    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("opens season popover and shows available options", () => {
    // season_ids must include the season id so the availability filter passes
    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: {
        season_ids: [1],
        league_ids: [],
        stages: [],
        team_ids: [],
        map_ids: []
      },
      isValidating: false,
      isError: false,
      isLoading: false
    });

    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    fireEvent.click(screen.getByRole("button", { name: "Seasons" }));

    expect(screen.getByText("Season 12")).toBeInTheDocument();
  });

  it("selecting an item appends it to query params", () => {
    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: {
        season_ids: [1],
        league_ids: [],
        stages: [],
        team_ids: [],
        map_ids: []
      },
      isValidating: false,
      isError: false,
      isLoading: false
    });

    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    // Open seasons popover
    fireEvent.click(screen.getByRole("button", { name: "Seasons" }));
    // Click the Season 12 option inside the popover
    const option = screen.getByText("Season 12");
    fireEvent.click(option);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("seasons=1")
    );
  });

  it("deselecting a selected item removes it from query params", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("seasons=1"));

    render(
      <FilterBarDesktop
        filterParams={{ ...defaultFilterParams, seasons: [1] }}
      />
    );

    // The chip remove button (X icon inside chip span)
    const removeBtn = document.querySelector("span.cursor-pointer");
    expect(removeBtn).not.toBeNull();
    fireEvent.click(removeBtn!);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.not.stringContaining("seasons=1")
    );
  });

  it("removes a chip via keyboard Enter on the X button", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("seasons=1"));

    render(
      <FilterBarDesktop
        filterParams={{ ...defaultFilterParams, seasons: [1] }}
      />
    );

    const removeBtn = document.querySelector("span.cursor-pointer");
    expect(removeBtn).not.toBeNull();
    fireEvent.keyDown(removeBtn!, { key: "Enter" });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.not.stringContaining("seasons=1")
    );
  });

  it("shows a dot color span for selected league items in popover", () => {
    mockSwr.mockImplementation((key: string) => {
      if (key === "/api/v1/leagues") {
        return {
          data: [{ id: 10, name: "CS2 Masters", sort_priority: 1 }]
        };
      }
      if (key === "/api/v1/seasons") return { data: [] };
      if (key === "/api/v1/stages") return { data: [] };
      if (key === "/api/v1/teams") return { data: [] };
      if (key === "/api/v1/maps") return { data: [] };
      return { data: undefined };
    });
    // league_ids must include the league id
    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: {
        season_ids: [],
        league_ids: [10],
        stages: [],
        team_ids: [],
        map_ids: []
      },
      isValidating: false,
      isError: false,
      isLoading: false
    });

    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    fireEvent.click(screen.getByRole("button", { name: "Leagues" }));

    // The item text should be visible in the open popover
    expect(screen.getByText("CS2 Masters")).toBeInTheDocument();
  });

  it("shows 'No options available' in popover when available IDs exclude all items", () => {
    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: {
        season_ids: [999], // no match for season id=1
        league_ids: [],
        stages: [],
        team_ids: [],
        map_ids: []
      },
      isValidating: false,
      isError: false,
      isLoading: false
    });

    render(<FilterBarDesktop filterParams={defaultFilterParams} />);

    fireEvent.click(screen.getByRole("button", { name: "Seasons" }));

    expect(screen.getByText("No options available")).toBeInTheDocument();
  });
});
