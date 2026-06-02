import React from "react";
import { render, screen } from "@testing-library/react";
import { PlayerDetailsHeader } from "./PlayerDetailsHeader";
import { useFilters } from "@/context/FilterContext";
import { usePlayerTeamDetails } from "@/hooks/data/filtered/usePlayerTeamDetails";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";
import { useFaceitPlayerData } from "@/hooks/data/useFaceitPlayerData";

jest.mock("@/context/FilterContext");
jest.mock("@/hooks/data/filtered/usePlayerTeamDetails");
jest.mock("@/hooks/data/useSteamPlayer");
jest.mock("@/hooks/data/useFaceITRank");
jest.mock("@/hooks/data/useCS2PremierRank");
jest.mock("@/hooks/data/useFaceitPlayerData");

jest.mock("./PlayerWinsLosses", () => ({
  PlayerWinsLosses: () => <div data-testid="player-wins-losses" />
}));

jest.mock("../profile/FaceITLevelIcon", () => ({
  FaceITLevelIcon: ({ level }: { level: number }) => (
    <div data-testid={`faceit-level-${level}`} />
  )
}));

jest.mock("../profile/CS2PremierRankBadge", () => ({
  CS2PremierRankBadge: ({ rankScore }: { rankScore: number }) => (
    <div data-testid={`cs2-rank-${rankScore}`} />
  )
}));

jest.mock("../ui/FaceitLink", () => ({
  FaceitLink: () => <a data-testid="faceit-link" href="#" />
}));

jest.mock("../layout/ContentContainer", () => ({
  ContentContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) => <img src={src} alt={alt} {...props} />
}));

const mockUseFilters = useFilters as jest.MockedFunction<typeof useFilters>;
const mockUsePlayerTeamDetails = usePlayerTeamDetails as jest.MockedFunction<
  typeof usePlayerTeamDetails
>;
const mockUseSteamPlayer = useSteamPlayer as jest.MockedFunction<
  typeof useSteamPlayer
>;
const mockUseFaceITRank = useFaceITRank as jest.MockedFunction<
  typeof useFaceITRank
>;
const mockUseCS2PremierRank = useCS2PremierRank as jest.MockedFunction<
  typeof useCS2PremierRank
>;
const mockUseFaceitPlayerData = useFaceitPlayerData as jest.MockedFunction<
  typeof useFaceitPlayerData
>;
const mockGetFilteredQueryString = jest
  .fn()
  .mockReturnValue("seasons=1&leagues=2");

function setupDefaultMocks() {
  mockUseFilters.mockReturnValue({
    filterParams: {
      seasons: [],
      leagues: [],
      stages: null,
      teams: null,
      maps: null
    },
    isLoading: false,
    error: undefined,
    isValidating: false,
    getFilteredQueryString: mockGetFilteredQueryString
  } as any);

  mockUseSteamPlayer.mockReturnValue({
    steamPlayer: { nickname: "ProGamer", avatar: null },
    isLoading: false,
    isError: undefined,
    isValidating: false
  } as any);

  mockUseFaceITRank.mockReturnValue({
    faceItRank: null,
    isLoading: false,
    isError: undefined,
    isValidating: false
  } as any);

  mockUseCS2PremierRank.mockReturnValue({
    cs2Rank: null,
    isLoading: false,
    isError: undefined,
    isValidating: false
  } as any);

  mockUseFaceitPlayerData.mockReturnValue({
    faceitPlayerData: null,
    isLoading: false,
    isError: undefined,
    isValidating: false
  } as any);
}

describe("PlayerDetailsHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFilteredQueryString.mockReturnValue("seasons=1&leagues=2");
    setupDefaultMocks();
  });

  it("renders loading skeleton when team details are loading", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    } as any);

    const { container } = render(<PlayerDetailsHeader steamId="12345" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders error message when player details fail to load", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: undefined,
      isLoading: false,
      isError: new Error("error"),
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(
      screen.getByText("Error loading player details.")
    ).toBeInTheDocument();
  });

  it("displays the player nickname", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("ProGamer")).toBeInTheDocument();
  });

  it("shows first letter of nickname as avatar when no avatar URL", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("shows player avatar image when avatar is available", () => {
    mockUseSteamPlayer.mockReturnValue({
      steamPlayer: { nickname: "ProGamer", avatar: "hash123" },
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    const avatar = screen.getByAltText("ProGamer");
    expect(avatar).toBeInTheDocument();
  });

  it("renders wins/losses component", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("player-wins-losses")).toBeInTheDocument();
  });

  it("renders team link when player is in exactly one team", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [
        { team_id: 5, team_name: "Alpha Team", team_logo: null }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    const teamLink = screen.getByText("Alpha Team").closest("a");

    expect(teamLink).toHaveAttribute("href", "/teams/5?seasons=1&leagues=2");
    expect(mockGetFilteredQueryString).toHaveBeenCalledWith(["teams"]);
  });

  it("shows count when player is in multiple teams", () => {
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [
        { team_id: 5, team_name: "Alpha Team", team_logo: null },
        { team_id: 6, team_name: "Beta Team", team_logo: null }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("In 2 teams")).toBeInTheDocument();
  });

  it("renders FaceIT level icon when rank data is available", () => {
    mockUseFaceITRank.mockReturnValue({
      faceItRank: { faceit_level: 10 },
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("faceit-level-10")).toBeInTheDocument();
  });

  it("renders CS2 premier rank badge when rank data is available", () => {
    mockUseCS2PremierRank.mockReturnValue({
      cs2Rank: { average_rank: 15000 },
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);
    mockUsePlayerTeamDetails.mockReturnValue({
      playerTeamDetails: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    } as any);

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("cs2-rank-15000")).toBeInTheDocument();
  });
});
