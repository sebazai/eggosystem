import React from "react";
import { render, screen } from "@testing-library/react";
import TeamTabLayoutClient from "./TeamTabLayoutClient";
import { useFilters } from "@/context/FilterContext";
import { usePathname } from "next/navigation";

jest.mock("@/context/FilterContext", () => ({
  useFilters: jest.fn(),
  FilterProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
}));

// Override global navigation mock locally
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => "/teams/42"),
  useParams: () => ({})
}));

jest.mock("@/components/filters/MultiFilters", () => ({
  MultiFilters: () => <div data-testid="multi-filters" />
}));

jest.mock("@/components/teams/TeamsHeader", () => ({
  TeamsHeader: () => <div data-testid="teams-header" />
}));

jest.mock("@/components/teams/TeamTrophies", () => ({
  TeamTrophies: () => <div data-testid="team-trophies" />
}));

jest.mock("@/components/loading", () => ({
  PageSkeleton: ({ showFilters }: { showFilters?: boolean }) => (
    <div data-testid="page-skeleton" data-show-filters={showFilters} />
  )
}));

const mockUseFilters = useFilters as jest.MockedFunction<typeof useFilters>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const makeFiltersValue = (
  overrides: Partial<ReturnType<typeof useFilters>>
): ReturnType<typeof useFilters> => ({
  activeSeason: null,
  filterParams: {
    seasons: null,
    leagues: null,
    stages: null,
    teams: null,
    maps: null,
    player_name: null
  },
  filterQueryString: "",
  getFilteredQueryString: jest.fn().mockReturnValue(""),
  isLoading: false,
  isValidating: false,
  error: undefined,
  areFiltersEmpty: true,
  ...overrides
});

const defaultFilterParams = {
  seasons: [1],
  leagues: [],
  stages: null,
  teams: [42],
  maps: null,
  player_name: null
};

const emptyFilterParams = {
  seasons: null,
  leagues: null,
  stages: null,
  teams: null,
  maps: null,
  player_name: null
};

describe("TeamTabLayoutClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/teams/42");
  });

  it("shows page skeleton when filters are loading", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: emptyFilterParams, isLoading: true })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows page skeleton when filters are still validating", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({
        filterParams: defaultFilterParams,
        isValidating: true
      })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows error message when filters fail to load", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({
        filterParams: emptyFilterParams,
        error: new Error("filter error")
      })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByText("Failed to load filters")).toBeInTheDocument();
  });

  it("renders team header, trophies, and tabs when loaded", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByTestId("teams-header")).toBeInTheDocument();
    expect(screen.getByTestId("team-trophies")).toBeInTheDocument();
    expect(screen.getByTestId("multi-filters")).toBeInTheDocument();
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders Main and Map Statistics tabs", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div />
      </TeamTabLayoutClient>
    );

    expect(screen.getByRole("link", { name: "Main" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Map Statistics" })
    ).toBeInTheDocument();
  });

  it("highlights the Main tab when on the team root path", () => {
    mockUsePathname.mockReturnValue("/teams/42");
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div />
      </TeamTabLayoutClient>
    );

    const mainTab = screen.getByRole("link", { name: "Main" });
    expect(mainTab.className).toContain("border-kanaliiga-orange");
  });

  it("highlights Map Statistics tab when on mapstats path", () => {
    mockUsePathname.mockReturnValue("/teams/42/mapstats");
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );

    render(
      <TeamTabLayoutClient teamId="42">
        <div />
      </TeamTabLayoutClient>
    );

    const mapStatsTab = screen.getByRole("link", { name: "Map Statistics" });
    expect(mapStatsTab.className).toContain("border-kanaliiga-orange");
  });
});
