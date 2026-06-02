import React from "react";
import { render, screen } from "@testing-library/react";
import { SeasonStatusSection } from "./SeasonStatusSection";
import { useLandingSeasonContext } from "@/hooks/data/useLandingSeasonContext";
import { useSeasonResultsSeasons } from "@/hooks/data/useSeasonResults";

jest.mock("@/hooks/data/useLandingSeasonContext");
jest.mock("@/hooks/data/useSeasonResults");

// SeasonButtons also uses useLandingSeasonContext internally
jest.mock("./SeasonButtons", () => ({
  SeasonButtons: () => <div data-testid="season-buttons" />
}));

const mockUseLandingSeasonContext =
  useLandingSeasonContext as jest.MockedFunction<
    typeof useLandingSeasonContext
  >;
const mockUseSeasonResultsSeasons =
  useSeasonResultsSeasons as jest.MockedFunction<
    typeof useSeasonResultsSeasons
  >;

describe("SeasonStatusSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeasonResultsSeasons.mockReturnValue({
      seasons: [],
      isLoading: false,
      isValidating: false,
      error: undefined
    });
  });

  it("renders loading skeleton when isLoading is true", () => {
    mockUseLandingSeasonContext.mockReturnValue({
      seasonPhase: { phase: "concluded", seasonNumber: null, seasonName: null },
      referenceSeasonId: null,
      isLoading: true,
      isError: undefined,
      isValidating: false,
      signupOrActiveSeason: null
    });

    render(<SeasonStatusSection />);

    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders live season content when phase is live", () => {
    mockUseLandingSeasonContext.mockReturnValue({
      seasonPhase: { phase: "live", seasonNumber: 15, seasonName: "Season 15" },
      referenceSeasonId: 15,
      isLoading: false,
      isError: undefined,
      isValidating: false,
      signupOrActiveSeason: null
    });

    render(<SeasonStatusSection />);

    expect(screen.getByText(/CS2 Season 15 – Live Now/)).toBeInTheDocument();
    expect(
      screen.getByText(/Season is currently in progress/)
    ).toBeInTheDocument();
    expect(screen.getByTestId("season-buttons")).toBeInTheDocument();
  });

  it("renders signup content when phase is signup", () => {
    mockUseLandingSeasonContext.mockReturnValue({
      seasonPhase: {
        phase: "signup",
        seasonNumber: 16,
        seasonName: "Season 16"
      },
      referenceSeasonId: 16,
      isLoading: false,
      isError: undefined,
      isValidating: false,
      signupOrActiveSeason: null
    });

    render(<SeasonStatusSection />);

    expect(
      screen.getByText(/Registration for Season 16 Open/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sign up your team for the upcoming season/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Register Your Team/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse Past Matches/ })
    ).toBeInTheDocument();
  });

  it("renders concluded content when phase is concluded", () => {
    mockUseLandingSeasonContext.mockReturnValue({
      seasonPhase: { phase: "concluded", seasonNumber: 14, seasonName: null },
      referenceSeasonId: 14,
      isLoading: false,
      isError: undefined,
      isValidating: false,
      signupOrActiveSeason: null
    });

    mockUseSeasonResultsSeasons.mockReturnValue({
      seasons: [{ season_id: 14, season_name: "Season 14" }],
      isLoading: false,
      isValidating: false,
      error: undefined
    });

    render(<SeasonStatusSection />);

    expect(screen.getByText(/CS2 Corporate League/)).toBeInTheDocument();
    expect(screen.getByText(/Season 14 has/)).toBeInTheDocument();
    expect(screen.getByTestId("season-buttons")).toBeInTheDocument();
  });

  it("renders concluded content with generic text when no season name", () => {
    mockUseLandingSeasonContext.mockReturnValue({
      seasonPhase: { phase: "concluded", seasonNumber: null, seasonName: null },
      referenceSeasonId: null,
      isLoading: false,
      isError: undefined,
      isValidating: false,
      signupOrActiveSeason: null
    });

    render(<SeasonStatusSection />);

    expect(screen.getByText(/The season has/)).toBeInTheDocument();
  });
});
