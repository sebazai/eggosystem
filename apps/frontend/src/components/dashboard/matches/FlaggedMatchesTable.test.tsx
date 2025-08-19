import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FlaggedMatchesTable } from "./FlaggedMatchesTable";
import { useFlaggedMatches } from "@/hooks/data/dashboard/useFlaggedMatches";
import type { FlaggedMatches } from "@eggosystem/types";

// Mock the useFlaggedMatches hook
jest.mock("@/hooks/data/dashboard/useFlaggedMatches");
const mockUseFlaggedMatches = useFlaggedMatches as jest.MockedFunction<
  typeof useFlaggedMatches
>;

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

      expect(screen.getByText("Match ID")).toBeInTheDocument();
      expect(screen.getByText("Team ID")).toBeInTheDocument();
      expect(screen.getByText("Steam IDs")).toBeInTheDocument();
      expect(screen.getByText("Match IDs")).toBeInTheDocument();
      expect(screen.getByText("Added Players")).toBeInTheDocument();
    });

    it("displays match data in table rows", () => {
      render(<FlaggedMatchesTable />);

      // Check first match data
      expect(screen.getByText("match_12345")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("84")).toBeInTheDocument();
      expect(screen.getByText("123")).toBeInTheDocument();
    });

    it("displays Steam IDs as badges with truncation", () => {
      render(<FlaggedMatchesTable />);

      // First match should show 3 steam IDs
      expect(screen.getByText("76561198123456789")).toBeInTheDocument();
      expect(screen.getByText("76561198987654321")).toBeInTheDocument();
      expect(screen.getByText("76561198555444333")).toBeInTheDocument();

      // Third match should show first 3 + "more" indicator
      expect(screen.getByText("76561198000000001")).toBeInTheDocument();
      expect(screen.getByText("76561198000000002")).toBeInTheDocument();
      expect(screen.getByText("76561198000000003")).toBeInTheDocument();

      // Check for "more" badges (there will be multiple, so use getAllByText)
      const moreBadges = screen.getAllByText(/\+\d+ more/);
      expect(moreBadges.length).toBeGreaterThan(0);
    });

    it("displays Match IDs as badges with truncation", () => {
      render(<FlaggedMatchesTable />);

      // First match should show first 2 match IDs
      expect(screen.getByText("101")).toBeInTheDocument();
      expect(screen.getByText("102")).toBeInTheDocument();

      // Third match should show first 2 match IDs
      expect(screen.getByText("301")).toBeInTheDocument();
      expect(screen.getByText("302")).toBeInTheDocument();

      // Check for truncation indicators
      const moreBadges = screen.getAllByText(/\+\d+ more/);
      expect(moreBadges.length).toBeGreaterThan(0);
    });

    it("displays Added Players as destructive badges with truncation", () => {
      render(<FlaggedMatchesTable />);

      // First match should show first 2 added players
      expect(screen.getByText("suspicious_player_1")).toBeInTheDocument();
      expect(screen.getByText("suspicious_player_2")).toBeInTheDocument();

      // Third match should show first 2 players
      expect(screen.getByText("player1")).toBeInTheDocument();
      expect(screen.getByText("player2")).toBeInTheDocument();

      // Check for truncation indicators
      const moreBadges = screen.getAllByText(/\+\d+ more/);
      expect(moreBadges.length).toBeGreaterThan(0);
    });

    it("displays 'None' for matches with no added players", () => {
      render(<FlaggedMatchesTable />);

      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("applies correct badge variants", () => {
      render(<FlaggedMatchesTable />);

      // Steam IDs and Match IDs should use secondary variant
      const steamIdBadge = screen
        .getByText("76561198123456789")
        .closest("span");
      const matchIdBadge = screen.getByText("101").closest("span");

      // Added players should use destructive variant
      const addedPlayerBadge = screen
        .getByText("suspicious_player_1")
        .closest("span");

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

      const matchIdHeaderDiv = screen.getByText("Match ID").closest("div");
      const teamIdHeaderDiv = screen.getByText("Team ID").closest("div");

      expect(matchIdHeaderDiv).toHaveClass("cursor-pointer");
      expect(teamIdHeaderDiv).toHaveClass("cursor-pointer");

      // Steam IDs, Match IDs, and Added Players should not be sortable
      const steamIdsHeaderDiv = screen.getByText("Steam IDs").closest("div");
      expect(steamIdsHeaderDiv).not.toHaveClass("cursor-pointer");
    });

    it("handles row hover effects", () => {
      render(<FlaggedMatchesTable />);

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1]; // Skip header row

      expect(firstDataRow).toHaveClass("hover:bg-muted/50");
    });

    it("applies responsive classes to columns", () => {
      render(<FlaggedMatchesTable />);

      // Match IDs column should be hidden on mobile
      const matchIdsHeader = screen.getByText("Match IDs").closest("th");
      expect(matchIdsHeader).toHaveClass("hidden", "md:table-cell");

      // Added Players column should be hidden on smaller screens
      const addedPlayersHeader = screen
        .getByText("Added Players")
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

    it("allows sorting by Match ID", async () => {
      render(<FlaggedMatchesTable />);

      const matchIdHeader = screen.getByText("Match ID");

      // Click to sort
      fireEvent.click(matchIdHeader);

      await waitFor(() => {
        // Verify sorting icons appear
        const sortIcons = matchIdHeader.parentElement?.querySelectorAll("svg");
        expect(sortIcons).toHaveLength(2); // ChevronUp and ChevronDown
      });
    });

    it("allows sorting by Team ID", async () => {
      render(<FlaggedMatchesTable />);

      const teamIdHeader = screen.getByText("Team ID");

      // Click to sort
      fireEvent.click(teamIdHeader);

      await waitFor(() => {
        // Verify sorting icons appear
        const sortIcons = teamIdHeader.parentElement?.querySelectorAll("svg");
        expect(sortIcons).toHaveLength(2); // ChevronUp and ChevronDown
      });
    });

    it("does not allow sorting on non-sortable columns", () => {
      render(<FlaggedMatchesTable />);

      const steamIdsHeaderDiv = screen.getByText("Steam IDs").closest("div");
      const matchIdsHeaderDiv = screen.getByText("Match IDs").closest("div");
      const addedPlayersHeaderDiv = screen
        .getByText("Added Players")
        .closest("div");

      // These should not have click handlers
      expect(steamIdsHeaderDiv).not.toHaveClass("cursor-pointer");
      expect(matchIdsHeaderDiv).not.toHaveClass("cursor-pointer");
      expect(addedPlayersHeaderDiv).not.toHaveClass("cursor-pointer");
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
