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

// ---------------------------------------------------------------------------
// Typed mock factories — no blanket `as any`, each defaults match the real shape
// ---------------------------------------------------------------------------
const makeFiltersValue = (
  overrides: Partial<ReturnType<typeof useFilters>>
): ReturnType<typeof useFilters> => ({
  activeSeason: null,
  filterParams: {
    seasons: [],
    leagues: [],
    stages: null,
    teams: null,
    maps: null,
    player_name: null
  },
  filterQueryString: "",
  getFilteredQueryString: mockGetFilteredQueryString,
  isLoading: false,
  isValidating: false,
  error: undefined,
  areFiltersEmpty: true,
  ...overrides
});

const makePlayerTeamDetailsValue = (
  overrides: Partial<ReturnType<typeof usePlayerTeamDetails>>
): ReturnType<typeof usePlayerTeamDetails> => ({
  playerTeamDetails: undefined,
  isLoading: false,
  isError: undefined,
  isValidating: false,
  ...overrides
});

const makeSteamPlayerValue = (
  overrides: Partial<ReturnType<typeof useSteamPlayer>>
): ReturnType<typeof useSteamPlayer> => ({
  steamPlayer: undefined,
  isLoading: false,
  isError: undefined,
  isValidating: false,
  ...overrides
});

const makeFaceITRankValue = (
  overrides: Partial<ReturnType<typeof useFaceITRank>>
): ReturnType<typeof useFaceITRank> => ({
  faceItRank: undefined,
  isLoading: false,
  isError: undefined,
  isValidating: false,
  ...overrides
});

const makeCS2RankValue = (
  overrides: Partial<ReturnType<typeof useCS2PremierRank>>
): ReturnType<typeof useCS2PremierRank> => ({
  cs2Rank: undefined,
  isLoading: false,
  isError: undefined,
  isValidating: false,
  ...overrides
});

const makeFaceitPlayerDataValue = (
  overrides: Partial<ReturnType<typeof useFaceitPlayerData>>
): ReturnType<typeof useFaceitPlayerData> => ({
  faceitPlayerData: undefined,
  isLoading: false,
  isError: undefined,
  isValidating: false,
  ...overrides
});

function setupDefaultMocks() {
  mockUseFilters.mockReturnValue(makeFiltersValue({}));
  mockUseSteamPlayer.mockReturnValue(
    makeSteamPlayerValue({
      steamPlayer: { nickname: "ProGamer", avatar: null } as ReturnType<
        typeof useSteamPlayer
      >["steamPlayer"]
    })
  );
  mockUseFaceITRank.mockReturnValue(makeFaceITRankValue({ faceItRank: null }));
  mockUseCS2PremierRank.mockReturnValue(makeCS2RankValue({ cs2Rank: null }));
  mockUseFaceitPlayerData.mockReturnValue(
    makeFaceitPlayerDataValue({ faceitPlayerData: null })
  );
}

describe("PlayerDetailsHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFilteredQueryString.mockReturnValue("seasons=1&leagues=2");
    setupDefaultMocks();
  });

  it("renders loading skeleton when team details are loading", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ isLoading: true })
    );

    const { container } = render(<PlayerDetailsHeader steamId="12345" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders error message when player details fail to load", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ isError: new Error("error") })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(
      screen.getByText("Error loading player details.")
    ).toBeInTheDocument();
  });

  it("displays the player nickname", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("ProGamer")).toBeInTheDocument();
  });

  it("shows first letter of nickname as avatar when no avatar URL", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("shows player avatar image when avatar is available", () => {
    mockUseSteamPlayer.mockReturnValue(
      makeSteamPlayerValue({
        steamPlayer: { nickname: "ProGamer", avatar: "hash123" } as ReturnType<
          typeof useSteamPlayer
        >["steamPlayer"]
      })
    );
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    const avatar = screen.getByAltText("ProGamer");
    expect(avatar).toBeInTheDocument();
  });

  it("renders wins/losses component", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("player-wins-losses")).toBeInTheDocument();
  });

  it("renders team link when player is in exactly one team", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({
        playerTeamDetails: [
          { team_id: 5, team_name: "Alpha Team", team_logo: null }
        ] as ReturnType<typeof usePlayerTeamDetails>["playerTeamDetails"]
      })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    const teamLink = screen.getByText("Alpha Team").closest("a");
    expect(teamLink).toHaveAttribute("href", "/teams/5?seasons=1&leagues=2");
    expect(mockGetFilteredQueryString).toHaveBeenCalledWith(["teams"]);
  });

  it("shows count when player is in multiple teams", () => {
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({
        playerTeamDetails: [
          { team_id: 5, team_name: "Alpha Team", team_logo: null },
          { team_id: 6, team_name: "Beta Team", team_logo: null }
        ] as ReturnType<typeof usePlayerTeamDetails>["playerTeamDetails"]
      })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByText("In 2 teams")).toBeInTheDocument();
  });

  it("renders FaceIT level icon when rank data is available", () => {
    mockUseFaceITRank.mockReturnValue(
      makeFaceITRankValue({
        faceItRank: { faceit_level: 10 } as ReturnType<
          typeof useFaceITRank
        >["faceItRank"]
      })
    );
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("faceit-level-10")).toBeInTheDocument();
  });

  it("renders CS2 premier rank badge when rank data is available", () => {
    mockUseCS2PremierRank.mockReturnValue(
      makeCS2RankValue({
        cs2Rank: { average_rank: 15000 } as ReturnType<
          typeof useCS2PremierRank
        >["cs2Rank"]
      })
    );
    mockUsePlayerTeamDetails.mockReturnValue(
      makePlayerTeamDetailsValue({ playerTeamDetails: [] })
    );

    render(<PlayerDetailsHeader steamId="12345" />);
    expect(screen.getByTestId("cs2-rank-15000")).toBeInTheDocument();
  });
});
