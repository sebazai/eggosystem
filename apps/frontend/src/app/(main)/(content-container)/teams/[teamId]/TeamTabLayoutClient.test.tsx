import React from "react";
import { render, screen } from "@testing-library/react";
import TeamTabLayoutClient from "./TeamTabLayoutClient";
import { useFilters } from "@/context/FilterContext";
import { usePathname, useSearchParams } from "next/navigation";

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
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

const defaultFilterParams = {
  seasons: [1],
  leagues: [],
  stages: null,
  teams: [42],
  maps: null
};

const emptyFilterParams = {
  seasons: null,
  leagues: null,
  stages: null,
  teams: null,
  maps: null
};

describe("TeamTabLayoutClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/teams/42");
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as any);
  });

  it("shows page skeleton when filters are loading", () => {
    mockUseFilters.mockReturnValue({
      filterParams: emptyFilterParams,
      isLoading: true,
      error: undefined,
      isValidating: false
    } as any);

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows page skeleton when filters are still validating", () => {
    mockUseFilters.mockReturnValue({
      filterParams: defaultFilterParams,
      isLoading: false,
      error: undefined,
      isValidating: true
    } as any);

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows error message when filters fail to load", () => {
    mockUseFilters.mockReturnValue({
      filterParams: emptyFilterParams,
      isLoading: false,
      error: new Error("filter error"),
      isValidating: false
    } as any);

    render(
      <TeamTabLayoutClient teamId="42">
        <div data-testid="children" />
      </TeamTabLayoutClient>
    );

    expect(screen.getByText("Failed to load filters")).toBeInTheDocument();
  });

  it("renders team header, trophies, and tabs when loaded", () => {
    mockUseFilters.mockReturnValue({
      filterParams: defaultFilterParams,
      isLoading: false,
      error: undefined,
      isValidating: false
    } as any);

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
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("seasons=1&leagues=2") as any
    );
    mockUseFilters.mockReturnValue({
      filterParams: defaultFilterParams,
      isLoading: false,
      error: undefined,
      isValidating: false
    } as any);

    render(
      <TeamTabLayoutClient teamId="42">
        <div />
      </TeamTabLayoutClient>
    );

    expect(screen.getByRole("link", { name: "Main" })).toHaveAttribute(
      "href",
      "/teams/42?seasons=1&leagues=2"
    );
    expect(
      screen.getByRole("link", { name: "Map Statistics" })
    ).toHaveAttribute("href", "/teams/42/mapstats?seasons=1&leagues=2");
  });

  it("highlights the Main tab when on the team root path", () => {
    mockUsePathname.mockReturnValue("/teams/42");
    mockUseFilters.mockReturnValue({
      filterParams: defaultFilterParams,
      isLoading: false,
      error: undefined,
      isValidating: false
    } as any);

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
    mockUseFilters.mockReturnValue({
      filterParams: defaultFilterParams,
      isLoading: false,
      error: undefined,
      isValidating: false
    } as any);

    render(
      <TeamTabLayoutClient teamId="42">
        <div />
      </TeamTabLayoutClient>
    );

    const mapStatsTab = screen.getByRole("link", { name: "Map Statistics" });
    expect(mapStatsTab.className).toContain("border-kanaliiga-orange");
  });
});
