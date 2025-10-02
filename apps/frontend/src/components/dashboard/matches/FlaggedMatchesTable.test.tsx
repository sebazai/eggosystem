import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FlaggedMatchesTable } from "./FlaggedMatchesTable";
import { useFlaggedMatches } from "@/hooks/data/dashboard/useFlaggedMatches";
import type { FlaggedMatches } from "@eggosystem/types";

// Mock the useFlaggedMatches hook
jest.mock("@/hooks/data/dashboard/useFlaggedMatches");
const mockUseFlaggedMatches = useFlaggedMatches as jest.MockedFunction<
  typeof useFlaggedMatches
>;

// Mock the badge components
jest.mock("./TeamBadge", () => ({
  TeamBadge: ({ teamId }: { teamId: number }) => (
    <span data-testid={`team-badge-${teamId}`}>Team {teamId}</span>
  )
}));

jest.mock("./PlayerBadge", () => ({
  PlayerBadge: ({
    steamId,
    variant
  }: {
    steamId: string;
    variant?: string;
  }) => (
    <span
      data-testid={`player-badge-${steamId}`}
      className={variant === "destructive" ? "bg-destructive" : "bg-secondary"}
    >
      {steamId}
    </span>
  )
}));

jest.mock("./MatchIdBadge", () => ({
  MatchIdBadge: ({ matchId }: { matchId: number }) => (
    <span data-testid={`match-badge-${matchId}`} className="bg-secondary">
      {matchId}
    </span>
  )
}));

jest.mock("./ExternalMatchIdBadge", () => ({
  ExternalMatchIdBadge: ({ externalMatchId }: { externalMatchId: string }) => (
    <span data-testid={`external-match-badge-${externalMatchId}`}>
      {externalMatchId}
    </span>
  )
}));

const mockFlaggedMatchesData: FlaggedMatches[] = [
  {
    external_match_id: "match_12345",
    steam_ids: ["76561198123456789", "76561198987654321", "76561198555444333"],
    team_id: 42,
    match_ids: [101, 102, 103],
    players_added_for_this_match: ["suspicious_player_1", "suspicious_player_2"]
  },
  {
    external_match_id: "match_67890",
    steam_ids: ["76561198111222333", "76561198444555666"],
    team_id: 84,
    match_ids: [201],
    players_added_for_this_match: []
  },
  {
    external_match_id: "match_11111",
    steam_ids: [
      "76561198000000001",
      "76561198000000002",
      "76561198000000003",
      "76561198000000004",
      "76561198000000005"
    ],
    team_id: 123,
    match_ids: [301, 302, 303, 304],
    players_added_for_this_match: ["player1", "player2", "player3", "player4"]
  }
];

describe("FlaggedMatchesTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("displays loading state with spinner and message", () => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: undefined,
        isLoading: true,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      expect(screen.getByText("Flagged Matches")).toBeInTheDocument();
      expect(
        screen.getByText("Loading flagged matches...")
      ).toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument(); // spinner
    });
  });

  describe("Error State", () => {
    it("displays error state with proper error message", () => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: undefined,
        isLoading: false,
        error: new Error("Network error"),
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      expect(screen.getByText("Flagged Matches")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load flagged matches")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Please try refreshing the page or contact support if the problem persists."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no flagged matches", () => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: [],
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      expect(screen.getByText("Flagged Matches")).toBeInTheDocument();
      expect(screen.getByText("No flagged matches found")).toBeInTheDocument();
      expect(
        screen.getByText(
          "All matches appear to be clean - no suspicious activity detected."
        )
      ).toBeInTheDocument();
    });

    it("displays empty state when flagged matches is undefined", () => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: undefined,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      expect(screen.getByText("No flagged matches found")).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    beforeEach(() => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: mockFlaggedMatchesData,
        isLoading: false,
        error: undefined,
        isValidating: false
      });
    });

    it("displays the correct number of matches in header badge", () => {
      render(<FlaggedMatchesTable />);

      expect(screen.getByText("3 matches")).toBeInTheDocument();
    });

    it("displays singular form for one match", () => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: [mockFlaggedMatchesData[0]!],
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      expect(screen.getByText("1 match")).toBeInTheDocument();
    });

    it("displays all column headers", () => {
      render(<FlaggedMatchesTable />);

      expect(screen.getByText("EXTERNAL MATCH ID")).toBeInTheDocument();
      expect(screen.getByText("TEAM")).toBeInTheDocument();
      expect(screen.getByText("PLAYERS")).toBeInTheDocument();
      expect(screen.getByText("MATCH IDS")).toBeInTheDocument();
      expect(screen.getByText("ADDED PLAYERS")).toBeInTheDocument();
    });

    it("displays match data in table rows", () => {
      render(<FlaggedMatchesTable />);

      // Check first match data using mocked badge components
      expect(
        screen.getByTestId("external-match-badge-match_12345")
      ).toBeInTheDocument();
      expect(screen.getByTestId("team-badge-42")).toBeInTheDocument();
      expect(screen.getByTestId("team-badge-84")).toBeInTheDocument();
      expect(screen.getByTestId("team-badge-123")).toBeInTheDocument();
    });

    it("displays Steam IDs as badges", () => {
      render(<FlaggedMatchesTable />);

      // First match should show all 3 steam IDs using mocked badge components
      expect(
        screen.getByTestId("player-badge-76561198123456789")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198987654321")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198555444333")
      ).toBeInTheDocument();

      // Third match should show all 5 steam IDs
      expect(
        screen.getByTestId("player-badge-76561198000000001")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198000000002")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198000000003")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198000000004")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198000000005")
      ).toBeInTheDocument();
    });

    it("displays Match IDs as badges", () => {
      render(<FlaggedMatchesTable />);

      // First match should show all 3 match IDs using mocked badge components
      expect(screen.getByTestId("match-badge-101")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-102")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-103")).toBeInTheDocument();

      // Third match should show all 4 match IDs
      expect(screen.getByTestId("match-badge-301")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-302")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-303")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-304")).toBeInTheDocument();
    });

    it("displays Added Players as destructive badges", () => {
      render(<FlaggedMatchesTable />);

      // First match should show all 2 added players using mocked badge components
      expect(
        screen.getByTestId("player-badge-suspicious_player_1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-suspicious_player_2")
      ).toBeInTheDocument();

      // Third match should show all 4 players
      expect(screen.getByTestId("player-badge-player1")).toBeInTheDocument();
      expect(screen.getByTestId("player-badge-player2")).toBeInTheDocument();
      expect(screen.getByTestId("player-badge-player3")).toBeInTheDocument();
      expect(screen.getByTestId("player-badge-player4")).toBeInTheDocument();
    });

    it("displays 'None' for matches with no added players", () => {
      render(<FlaggedMatchesTable />);

      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("applies correct badge variants", () => {
      render(<FlaggedMatchesTable />);

      // Steam IDs and Match IDs should use secondary variant
      const steamIdBadge = screen.getByTestId("player-badge-76561198123456789");
      const matchIdBadge = screen.getByTestId("match-badge-101");

      // Added players should use destructive variant
      const addedPlayerBadge = screen.getByTestId(
        "player-badge-suspicious_player_1"
      );

      expect(steamIdBadge).toHaveClass("bg-secondary");
      expect(matchIdBadge).toHaveClass("bg-secondary");
      expect(addedPlayerBadge).toHaveClass("bg-destructive");
    });
  });

  describe("Table Functionality", () => {
    beforeEach(() => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: mockFlaggedMatchesData,
        isLoading: false,
        error: undefined,
        isValidating: false
      });
    });

    it("displays sortable column headers with sort icons", () => {
      render(<FlaggedMatchesTable />);

      const externalMatchIdHeader = screen
        .getByText("EXTERNAL MATCH ID")
        .closest("th");
      const teamHeader = screen.getByText("TEAM").closest("th");

      expect(externalMatchIdHeader).toHaveClass("cursor-pointer");
      expect(teamHeader).toHaveClass("cursor-pointer");

      // Players, Match IDs, and Added Players should not be sortable
      const playersHeaderDiv = screen.getByText("PLAYERS").closest("div");
      expect(playersHeaderDiv).not.toHaveClass("cursor-pointer");
    });

    it("handles row hover effects", () => {
      render(<FlaggedMatchesTable />);

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1]; // Skip header row

      expect(firstDataRow).toHaveClass("hover:bg-kanaliiga-light-brown/10");
    });

    it("applies responsive classes to columns", () => {
      render(<FlaggedMatchesTable />);

      // Match IDs column should be hidden on mobile
      const matchIdsHeader = screen.getByText("MATCH IDS").closest("th");
      expect(matchIdsHeader).toHaveClass("hidden", "md:table-cell");

      // Added Players column should be hidden on smaller screens
      const addedPlayersHeader = screen
        .getByText("ADDED PLAYERS")
        .closest("th");
      expect(addedPlayersHeader).toHaveClass("hidden", "lg:table-cell");
    });
  });

  describe("Table Sorting", () => {
    beforeEach(() => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: mockFlaggedMatchesData,
        isLoading: false,
        error: undefined,
        isValidating: false
      });
    });

    it("allows sorting by External Match ID", async () => {
      render(<FlaggedMatchesTable />);

      const externalMatchIdHeader = screen.getByText("EXTERNAL MATCH ID");

      // Click to sort
      fireEvent.click(externalMatchIdHeader);

      await waitFor(() => {
        // Verify sorting icons appear
        const sortIcons =
          externalMatchIdHeader.parentElement?.querySelectorAll("svg");
        expect(sortIcons).toHaveLength(1); // Only one icon shows at a time
      });
    });

    it("allows sorting by Team", async () => {
      render(<FlaggedMatchesTable />);

      const teamHeader = screen.getByText("TEAM");

      // Click to sort
      fireEvent.click(teamHeader);

      await waitFor(() => {
        // Verify sorting icons appear
        const sortIcons = teamHeader.closest("th")?.querySelectorAll("svg");
        expect(sortIcons).toHaveLength(1); // Only one icon shows at a time
      });
    });

    it("does not allow sorting on non-sortable columns", () => {
      render(<FlaggedMatchesTable />);

      const playersHeaderDiv = screen.getByText("PLAYERS").closest("div");
      const matchIdsHeaderDiv = screen.getByText("MATCH IDS").closest("div");
      const addedPlayersHeaderDiv = screen
        .getByText("ADDED PLAYERS")
        .closest("div");

      // These should not have click handlers
      expect(playersHeaderDiv).not.toHaveClass("cursor-pointer");
      expect(matchIdsHeaderDiv).not.toHaveClass("cursor-pointer");
      expect(addedPlayersHeaderDiv).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Edge Cases - Undefined/Null Arrays", () => {
    it("handles undefined steam_ids array", () => {
      const dataWithUndefinedSteamIds: FlaggedMatches[] = [
        {
          external_match_id: "match_undefined",
          steam_ids: undefined,
          team_id: 99,
          match_ids: [501],
          players_added_for_this_match: ["player1"]
        }
      ];

      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: dataWithUndefinedSteamIds,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      // Should show "None" instead of crashing
      const noneElements = screen.getAllByText("None");
      expect(noneElements.length).toBeGreaterThan(0);
      expect(
        screen.getByTestId("external-match-badge-match_undefined")
      ).toBeInTheDocument();
    });

    it("handles undefined match_ids array", () => {
      const dataWithUndefinedMatchIds: FlaggedMatches[] = [
        {
          external_match_id: "match_undefined_match_ids",
          steam_ids: ["76561198123456789"],
          team_id: 88,
          match_ids: undefined,
          players_added_for_this_match: ["player1"]
        }
      ];

      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: dataWithUndefinedMatchIds,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      // Should show "None" for match_ids instead of crashing
      const noneElements = screen.getAllByText("None");
      expect(noneElements.length).toBeGreaterThan(0);
      expect(
        screen.getByTestId("external-match-badge-match_undefined_match_ids")
      ).toBeInTheDocument();
    });

    it("handles undefined players_added_for_this_match array", () => {
      const dataWithUndefinedPlayers: FlaggedMatches[] = [
        {
          external_match_id: "match_undefined_players",
          steam_ids: ["76561198123456789"],
          team_id: 77,
          match_ids: [601],
          players_added_for_this_match: undefined
        }
      ];

      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: dataWithUndefinedPlayers,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      // Should show "None" for added players instead of crashing
      const noneElements = screen.getAllByText("None");
      expect(noneElements.length).toBeGreaterThan(0);
      expect(
        screen.getByTestId("external-match-badge-match_undefined_players")
      ).toBeInTheDocument();
    });

    it("handles empty arrays gracefully", () => {
      const dataWithEmptyArrays: FlaggedMatches[] = [
        {
          external_match_id: "match_empty_arrays",
          steam_ids: [], // Empty array
          team_id: 66,
          match_ids: [], // Empty array
          players_added_for_this_match: [] // Empty array
        }
      ];

      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: dataWithEmptyArrays,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      // Should show "None" for all empty arrays
      const noneElements = screen.getAllByText("None");
      expect(noneElements.length).toBe(3); // Steam IDs, Match IDs, and Added Players
      expect(
        screen.getByTestId("external-match-badge-match_empty_arrays")
      ).toBeInTheDocument();
    });

    it("handles mixed undefined and valid data", () => {
      const mixedData: FlaggedMatches[] = [
        {
          external_match_id: "match_mixed_1",
          steam_ids: ["76561198123456789"], // Valid
          team_id: 55,
          match_ids: undefined,
          players_added_for_this_match: ["player1"] // Valid
        },
        {
          external_match_id: "match_mixed_2",
          steam_ids: undefined,
          team_id: 44,
          match_ids: [701, 702], // Valid
          players_added_for_this_match: [] // Empty
        }
      ];

      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: mixedData,
        isLoading: false,
        error: undefined,
        isValidating: false
      });

      render(<FlaggedMatchesTable />);

      // Should handle mixed data gracefully
      expect(
        screen.getByTestId("external-match-badge-match_mixed_1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("external-match-badge-match_mixed_2")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("player-badge-76561198123456789")
      ).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-701")).toBeInTheDocument();
      expect(screen.getByTestId("player-badge-player1")).toBeInTheDocument();

      const noneElements = screen.getAllByText("None");
      expect(noneElements.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseFlaggedMatches.mockReturnValue({
        flaggedMatches: mockFlaggedMatchesData,
        isLoading: false,
        error: undefined,
        isValidating: false
      });
    });

    it("has proper table structure with headers", () => {
      render(<FlaggedMatchesTable />);

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole("columnheader");
      expect(columnHeaders).toHaveLength(5);
    });

    it("displays the title in the card header", () => {
      render(<FlaggedMatchesTable />);

      // Use getByText instead of getByRole for heading since CardTitle doesn't create a proper heading element
      const title = screen.getByText("Flagged Matches");
      expect(title).toBeInTheDocument();
    });
  });
});
