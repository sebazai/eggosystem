import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ListRegisteredTeams } from "./ListRegisteredTeams";
import {
  useRegisteredTeams,
  useBulkApproveTeams,
  useManualValidityCheck
} from "@/hooks/data/dashboard/useRegisteredTeams";
import {
  SeasonPlatform,
  type SeasonRegisteredTeamsWithPlayersValidatedTeams
} from "@eggosystem/types";

// Mock dependencies
jest.mock("@/hooks/data/dashboard/useRegisteredTeams");
jest.mock("sonner");

const mockUseRegisteredTeams = useRegisteredTeams as jest.MockedFunction<
  typeof useRegisteredTeams
>;
const mockUseBulkApproveTeams = useBulkApproveTeams as jest.MockedFunction<
  typeof useBulkApproveTeams
>;
const mockUseManualValidityCheck =
  useManualValidityCheck as jest.MockedFunction<typeof useManualValidityCheck>;

describe("ListRegisteredTeams", () => {
  const mockTeams = [
    {
      season_id: 1,
      team_id: 123,
      team_name: "Test Team 1",
      approved: false,
      terms_and_conditions_approved: true,
      external_platform_id: "team123",
      season_platform: SeasonPlatform.Kanaliiga,
      captain_nickname: "Captain1",
      captain_discord: "captain_discord#1234",
      co_captain_nickname: "CoCaptain1",
      co_captain_discord: null,
      approved_by: null,
      manual_validity_check_override: false,
      manual_validity_check_by: null,
      is_valid: true,
      invalid_players: [],
      players: [
        {
          steam_id: "76561198012345678",
          nickname: "Player1",
          work_email: "player1@company.com",
          is_work_email_personal_email: false,
          work_email_verified: true
        }
      ]
    },
    {
      season_id: 1,
      team_id: 456,
      team_name: "Test Team 2",
      approved: true,
      terms_and_conditions_approved: true,
      external_platform_id: null,
      season_platform: SeasonPlatform.FACEIT,
      captain_nickname: "Captain2",
      captain_discord: null,
      co_captain_nickname: null,
      co_captain_discord: null,
      approved_by: null,
      manual_validity_check_override: false,
      manual_validity_check_by: null,
      is_valid: false,
      invalid_players: [
        {
          steam_id: "76561198087654321",
          nickname: "Player2",
          work_email: "player2@gmail.com",
          is_work_email_personal_email: true,
          work_email_verified: true
        }
      ],
      players: [
        {
          steam_id: "76561198087654321",
          nickname: "Player2",
          work_email: "player2@gmail.com",
          is_work_email_personal_email: true,
          work_email_verified: true
        }
      ]
    }
  ];

  const mockBulkApprove = jest.fn();
  const mockManualValidityCheck = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRegisteredTeams.mockReturnValue({
      registeredTeams:
        mockTeams as SeasonRegisteredTeamsWithPlayersValidatedTeams[],
      isLoading: false,
      error: null,
      isValidating: false
    });

    mockUseBulkApproveTeams.mockReturnValue({
      bulkApprove: mockBulkApprove
    });

    mockUseManualValidityCheck.mockReturnValue({
      manualValidityCheck: mockManualValidityCheck
    });
  });

  describe("loading state", () => {
    it("should show loading spinner", () => {
      mockUseRegisteredTeams.mockReturnValue({
        registeredTeams: undefined,
        isLoading: true,
        error: null,
        isValidating: false
      });

      render(<ListRegisteredTeams />);
      // Check for the spinner div with the specific classes
      const spinnerDiv = document.querySelector(
        ".animate-spin.rounded-full.h-6.w-6.border-2"
      );
      expect(spinnerDiv).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error message", () => {
      mockUseRegisteredTeams.mockReturnValue({
        registeredTeams: undefined,
        isLoading: false,
        error: new Error("Failed to load"),
        isValidating: false
      });

      render(<ListRegisteredTeams />);
      expect(
        screen.getByText("Failed to load registered teams.")
      ).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty state message", () => {
      mockUseRegisteredTeams.mockReturnValue({
        registeredTeams: [],
        isLoading: false,
        error: null,
        isValidating: false
      });

      render(<ListRegisteredTeams />);
      expect(
        screen.getByText("No registered teams found.")
      ).toBeInTheDocument();
    });
  });

  describe("table rendering", () => {
    it("should render teams in table", () => {
      render(<ListRegisteredTeams />);

      expect(screen.getByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("Test Team 2")).toBeInTheDocument();
      expect(screen.getAllByText("Yes")).toHaveLength(4); // Valid team, approved team, and 2 terms approved
      expect(screen.getAllByText("No")).toHaveLength(2); // Invalid team and unapproved team
    });

    it("should render approval status correctly", () => {
      render(<ListRegisteredTeams />);

      // Should show both approval statuses
      const noElements = screen.getAllByText("No");
      expect(noElements).toHaveLength(2);

      // Approved team should show checkmark
      expect(screen.getAllByText("Yes")).toHaveLength(4);
    });

    it("should render terms approval status", () => {
      render(<ListRegisteredTeams />);

      // Both teams have terms approved
      const yesElements = screen.getAllByText("Yes");
      expect(yesElements.length).toBeGreaterThan(0);
    });
  });

  describe("row selection", () => {
    it("should handle row selection", () => {
      render(<ListRegisteredTeams />);

      const checkboxes = screen.getAllByRole("checkbox");
      const firstRowCheckbox = checkboxes[1]; // First data row checkbox

      fireEvent.click(firstRowCheckbox as Element);

      expect(firstRowCheckbox).toBeChecked();
    });

    it("should handle select all", () => {
      render(<ListRegisteredTeams />);

      const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
      fireEvent.click(selectAllCheckbox as Element);

      const dataCheckboxes = screen.getAllByRole("checkbox").slice(1);
      dataCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe("bulk actions", () => {
    it("should show bulk actions when rows are selected", () => {
      render(<ListRegisteredTeams />);

      // Initially no bulk actions
      expect(screen.queryByText("team(s) selected")).not.toBeInTheDocument();

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Should show bulk actions
      expect(screen.getByText("1 team(s) selected")).toBeInTheDocument();
      expect(screen.getByText("Approve Selected")).toBeInTheDocument();
      expect(screen.getByText("Validate Selected")).toBeInTheDocument();
    });

    it("should call bulk approve when button is clicked", async () => {
      mockBulkApprove.mockResolvedValue(undefined);

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click approve button
      const approveButton = screen.getByText("Approve Selected");
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockBulkApprove).toHaveBeenCalledWith([123]);
      });
    });

    it("should call manual validity check when button is clicked", async () => {
      mockManualValidityCheck.mockResolvedValue(undefined);

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click validate button
      const validateButton = screen.getByText("Validate Selected");
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(mockManualValidityCheck).toHaveBeenCalledWith([123]);
      });
    });
  });

  describe("expanded row details", () => {
    it("should expand row when expand button is clicked", () => {
      render(<ListRegisteredTeams />);

      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      // Should show team leadership
      expect(screen.getByText("Team Leadership")).toBeInTheDocument();
      expect(screen.getByText("Captain:")).toBeInTheDocument();
      // First team has discord username, so it shows that instead of nickname
      expect(screen.getByText("captain_discord#1234")).toBeInTheDocument();
      // Nickname should be shown in parentheses
      expect(screen.getByText("(Captain1)")).toBeInTheDocument();
    });

    it("should expand all rows when 'Expand All' button is clicked", () => {
      render(<ListRegisteredTeams />);

      // Initially should show "Expand All" button
      const expandAllButton = screen.getByText("Expand All");
      expect(expandAllButton).toBeInTheDocument();

      // Click expand all
      fireEvent.click(expandAllButton);

      // Should show expanded content for all teams
      expect(screen.getAllByText("Team Leadership")).toHaveLength(2);
      expect(screen.getAllByText("Players")).toHaveLength(2);
      // First team has discord username
      expect(screen.getByText("captain_discord#1234")).toBeInTheDocument();
      // Second team has no discord, so shows nickname
      expect(screen.getByText("Captain2")).toBeInTheDocument();
    });

    it("should collapse all rows when 'Collapse All' button is clicked", () => {
      render(<ListRegisteredTeams />);

      // Click expand all first
      const expandAllButton = screen.getByText("Expand All");
      fireEvent.click(expandAllButton);

      // Should now show "Collapse All" button
      const collapseAllButton = screen.getByText("Collapse All");
      expect(collapseAllButton).toBeInTheDocument();

      // Click collapse all
      fireEvent.click(collapseAllButton);

      // Should not show expanded content
      expect(screen.queryByText("Team Leadership")).not.toBeInTheDocument();
      expect(screen.queryByText("Players")).not.toBeInTheDocument();
    });

    it("should show players in expanded row", () => {
      render(<ListRegisteredTeams />);

      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      expect(screen.getByText("Players")).toBeInTheDocument();
      expect(screen.getByText("Player1")).toBeInTheDocument();
    });

    it("should show email type indicators", () => {
      render(<ListRegisteredTeams />);

      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[1] as Element); // Expand second team with personal email

      // Should show personal email indicator
      expect(screen.getByText("(Personal)")).toBeInTheDocument();
    });

    it("should show player links", () => {
      render(<ListRegisteredTeams />);

      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      expect(screen.getByText("Steam")).toBeInTheDocument();
      expect(screen.getByText("Kanahub")).toBeInTheDocument();
    });

    it("should show invalid player indicators", () => {
      render(<ListRegisteredTeams />);

      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[1] as Element); // Expand team with invalid player

      expect(screen.getByText("⚠️ Needs approval")).toBeInTheDocument();
    });
  });

  describe("external platform links", () => {
    it("should render Kanaliiga platform link correctly", () => {
      render(<ListRegisteredTeams />);

      const kanaliigaLink = screen.getByText("team123");
      expect(kanaliigaLink).toBeInTheDocument();
      expect(kanaliigaLink.closest("a")).toHaveAttribute(
        "href",
        "/teams/team123"
      );
    });

    it("should render FACEIT platform link correctly", () => {
      render(<ListRegisteredTeams />);

      // The second team has FACEIT platform but no external_platform_id
      // So it should show "-" instead of a link
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("should show dash for teams without platform ID", () => {
      render(<ListRegisteredTeams />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("loading states during actions", () => {
    it("should show loading state during bulk approve", async () => {
      mockBulkApprove.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click approve button
      const approveButton = screen.getByText("Approve Selected");
      fireEvent.click(approveButton);

      // Should show loading state
      expect(screen.getByText("Approving...")).toBeInTheDocument();
    });

    it("should show loading state during manual validity check", async () => {
      mockManualValidityCheck.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click validate button
      const validateButton = screen.getByText("Validate Selected");
      fireEvent.click(validateButton);

      // Should show loading state
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });
  });
});
