import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ListRegisteredTeams } from "./ListRegisteredTeams";
import {
  useRegisteredTeams,
  useBulkApproveTeams,
  useManualValidityCheck
} from "@/hooks/data/dashboard/useRegisteredTeams";
import { toast } from "sonner";
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
const mockToast = toast as jest.Mocked<typeof toast>;

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
      co_captain_nickname: "CoCaptain1",
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
          is_work_email_personal_email: false
        },
        {
          steam_id: "76561198087654321",
          nickname: "Player2",
          work_email: "player2@company.com",
          is_work_email_personal_email: false
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
      co_captain_nickname: null,
      approved_by: null,
      manual_validity_check_override: false,
      manual_validity_check_by: null,
      is_valid: false,
      invalid_players: [
        {
          steam_id: "76561198011111111",
          nickname: "InvalidPlayer",
          work_email: "invalid@gmail.com",
          is_work_email_personal_email: true
        }
      ],
      players: [
        {
          steam_id: "76561198011111111",
          nickname: "InvalidPlayer",
          work_email: "invalid@gmail.com",
          is_work_email_personal_email: true
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
    it("should show loading spinner when loading", () => {
      mockUseRegisteredTeams.mockReturnValue({
        registeredTeams: undefined,
        isLoading: true,
        error: null,
        isValidating: false
      });

      render(<ListRegisteredTeams />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error message when there is an error", () => {
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
    it("should show empty message when no teams", () => {
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
    it("should render table with team data", () => {
      render(<ListRegisteredTeams />);

      expect(screen.getByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("Test Team 2")).toBeInTheDocument();
      expect(screen.getByText("Yes")).toBeInTheDocument(); // Valid team
      expect(screen.getByText("No")).toBeInTheDocument(); // Invalid team
    });

    it("should show total teams count", () => {
      render(<ListRegisteredTeams />);

      expect(screen.getByText("Total teams: 2")).toBeInTheDocument();
    });

    it("should render team validity status correctly", () => {
      render(<ListRegisteredTeams />);

      // Valid team should show "Yes"
      const validStatus = screen.getAllByText("Yes")[0];
      expect(validStatus).toHaveClass("text-green-600");

      // Invalid team should show "No"
      const invalidStatus = screen.getAllByText("No")[0];
      expect(invalidStatus).toHaveClass("text-red-500");
    });

    it("should render approval status correctly", () => {
      render(<ListRegisteredTeams />);

      // Unapproved team
      expect(screen.getByText("No")).toBeInTheDocument();

      // Approved team should show checkmark
      expect(screen.getByText("Yes")).toBeInTheDocument();
      expect(screen.getByTestId("check-circle")).toBeInTheDocument();
    });
  });

  describe("row selection", () => {
    it("should allow selecting individual rows", () => {
      render(<ListRegisteredTeams />);

      const checkboxes = screen.getAllByRole("checkbox");
      const firstRowCheckbox = checkboxes[1]; // Skip header checkbox

      fireEvent.click(firstRowCheckbox as Element);

      expect(firstRowCheckbox).toBeChecked();
    });

    it("should allow selecting all rows", () => {
      render(<ListRegisteredTeams />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];

      fireEvent.click(headerCheckbox as Element);

      const rowCheckboxes = screen.getAllByRole("checkbox").slice(1);
      rowCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it("should show bulk actions when rows are selected", () => {
      render(<ListRegisteredTeams />);

      // Initially no bulk actions should be visible
      expect(screen.queryByText("team(s) selected")).not.toBeInTheDocument();

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Bulk actions should now be visible
      expect(screen.getByText("1 team(s) selected")).toBeInTheDocument();
      expect(screen.getByText("Approve Selected")).toBeInTheDocument();
      expect(screen.getByText("Validate Selected")).toBeInTheDocument();
    });
  });

  describe("bulk actions", () => {
    it("should call bulk approve when approve button is clicked", async () => {
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
        expect(mockToast.success).toHaveBeenCalledWith(
          "Successfully approved 1 team(s)"
        );
      });
    });

    it("should call manual validity check when validate button is clicked", async () => {
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
        expect(mockToast.success).toHaveBeenCalledWith(
          "Successfully validated 1 team(s)"
        );
      });
    });

    it("should handle bulk approve errors", async () => {
      mockBulkApprove.mockRejectedValue(new Error("Approve failed"));

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click approve button
      const approveButton = screen.getByText("Approve Selected");
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to approve teams");
      });
    });

    it("should handle manual validity check errors", async () => {
      mockManualValidityCheck.mockRejectedValue(new Error("Validation failed"));

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Click validate button
      const validateButton = screen.getByText("Validate Selected");
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to manually validate teams"
        );
      });
    });

    it("should clear selection after successful action", async () => {
      mockBulkApprove.mockResolvedValue(undefined);

      render(<ListRegisteredTeams />);

      // Select a row
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1];
      fireEvent.click(firstRowCheckbox as Element);

      // Verify selection is shown
      expect(screen.getByText("1 team(s) selected")).toBeInTheDocument();

      // Click approve button
      const approveButton = screen.getByText("Approve Selected");
      fireEvent.click(approveButton);

      await waitFor(() => {
        // Selection should be cleared
        expect(screen.queryByText("team(s) selected")).not.toBeInTheDocument();
      });
    });
  });

  describe("expanded row details", () => {
    it("should show team leadership when row is expanded", () => {
      render(<ListRegisteredTeams />);

      // Click expand button for first row
      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      expect(screen.getByText("Team Leadership")).toBeInTheDocument();
      expect(screen.getByText("Captain:")).toBeInTheDocument();
      expect(screen.getByText("Captain1")).toBeInTheDocument();
      expect(screen.getByText("Co-Captain:")).toBeInTheDocument();
      expect(screen.getByText("CoCaptain1")).toBeInTheDocument();
    });

    it("should show players when row is expanded", () => {
      render(<ListRegisteredTeams />);

      // Click expand button for first row
      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      expect(screen.getByText("Players")).toBeInTheDocument();
      expect(screen.getByText("Player1")).toBeInTheDocument();
      expect(screen.getByText("Player2")).toBeInTheDocument();
      expect(screen.getByText("player1@company.com")).toBeInTheDocument();
      expect(screen.getByText("player2@company.com")).toBeInTheDocument();
    });

    it("should show invalid players with warning", () => {
      render(<ListRegisteredTeams />);

      // Click expand button for second row (has invalid player)
      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[1] as Element);

      expect(screen.getByText("InvalidPlayer")).toBeInTheDocument();
      expect(screen.getByText("invalid@gmail.com")).toBeInTheDocument();
      expect(screen.getByText("⚠️ Needs approval")).toBeInTheDocument();
    });

    it("should show email type indicators", () => {
      render(<ListRegisteredTeams />);

      // Click expand button for first row
      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      // Should show work email indicators
      const workEmailIndicators = screen.getAllByText("(Work)");
      expect(workEmailIndicators).toHaveLength(2);

      // Click expand button for second row
      fireEvent.click(expandButtons[1] as Element);

      // Should show personal email indicator
      expect(screen.getByText("(Personal)")).toBeInTheDocument();
    });

    it("should show player links", () => {
      render(<ListRegisteredTeams />);

      // Click expand button for first row
      const expandButtons = screen.getAllByLabelText("Expand");
      fireEvent.click(expandButtons[0] as Element);

      // Should show Steam and Kanahub links
      const steamLinks = screen.getAllByText("Steam");
      const kanahubLinks = screen.getAllByText("Kanahub");

      expect(steamLinks).toHaveLength(2);
      expect(kanahubLinks).toHaveLength(2);
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

      const faceitLink = screen.getByText("team123");
      expect(faceitLink).toBeInTheDocument();
      expect(faceitLink.closest("a")).toHaveAttribute(
        "href",
        "https://www.faceit.com/en/teams/team123"
      );
      expect(faceitLink.closest("a")).toHaveAttribute("target", "_blank");
    });

    it("should show dash for null platform ID", () => {
      render(<ListRegisteredTeams />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("loading states during actions", () => {
    it("should show loading state during bulk approve", async () => {
      // Mock a delayed response
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
      expect(approveButton).toBeDisabled();
    });

    it("should show loading state during manual validity check", async () => {
      // Mock a delayed response
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
      expect(validateButton).toBeDisabled();
    });
  });
});
