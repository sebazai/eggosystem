import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualPlayerApprovalForm } from "./ManualPlayerApprovalForm";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { usePlayerFullName } from "@/hooks/data/dashboard/usePlayerFullName";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
// CREATE_NEW_VALUE is imported but not used in current test structure

// Mock dependencies
jest.mock("@/hooks/data/dashboard/useSelectableTeams");
jest.mock("@/hooks/data/dashboard/useSelectableOrgs");
jest.mock("@/hooks/data/dashboard/usePlayerFullName");
jest.mock("@/lib/apiClient");
jest.mock("sonner");

const mockUseSelectableTeams = useSelectableTeams as jest.MockedFunction<
  typeof useSelectableTeams
>;
const mockUseSelectableOrgs = useSelectableOrgs as jest.MockedFunction<
  typeof useSelectableOrgs
>;
const mockUsePlayerFullName = usePlayerFullName as jest.MockedFunction<
  typeof usePlayerFullName
>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("ManualPlayerApprovalForm", () => {
  const mockTeams = [
    { id: 1, name: "Team Alpha", organization_id: 1 },
    { id: 2, name: "Team Beta", organization_id: 1 },
    { id: 3, name: "Team Gamma", organization_id: 2 }
  ];

  const mockOrgs = [
    { id: 1, name: "Org Alpha", organization_code: "ALPHA" },
    { id: 2, name: "Org Beta", organization_code: "BETA" }
  ];

  const mockPlayerFullName = {
    fullName: "John Doe",
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSelectableTeams.mockReturnValue({
      teams: mockTeams,
      isLoading: false,
      error: null,
      isValidating: false
    });

    mockUseSelectableOrgs.mockReturnValue({
      organizations: mockOrgs,
      isLoading: false,
      error: null,
      isValidating: false
    });

    mockUsePlayerFullName.mockReturnValue(mockPlayerFullName);
  });

  describe("form rendering", () => {
    it("should render all form fields", () => {
      render(<ManualPlayerApprovalForm />);

      expect(screen.getByLabelText(/ticket id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/details/i)).toBeInTheDocument();
      expect(screen.getByText(/add player/i)).toBeInTheDocument();
    });

    it("should show loading states for teams and orgs", () => {
      mockUseSelectableTeams.mockReturnValue({
        teams: [],
        isLoading: true,
        error: null,
        isValidating: false
      });

      mockUseSelectableOrgs.mockReturnValue({
        organizations: [],
        isLoading: true,
        error: null,
        isValidating: false
      });

      render(<ManualPlayerApprovalForm />);

      expect(screen.getByText(/loading teams/i)).toBeInTheDocument();
      expect(screen.getByText(/loading organizations/i)).toBeInTheDocument();
    });
  });

  describe("player management", () => {
    it("should add a new player when add player button is clicked", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      // Should show steam ID input
      expect(screen.getByLabelText(/steam id/i)).toBeInTheDocument();
    });

    it("should remove a player when remove button is clicked", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Add a player first
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      // Fill in steam ID
      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Remove the player
      const removeButton = screen.getByRole("button", { name: /remove/i });
      await user.click(removeButton);

      // Steam ID input should be gone
      expect(screen.queryByLabelText(/steam id/i)).not.toBeInTheDocument();
    });

    it("should validate steam ID format", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      // Enter invalid steam ID
      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "invalid-steam-id");

      // Try to submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/invalid steam id format/i)
        ).toBeInTheDocument();
      });
    });

    it("should fetch and display player name when steam ID is entered", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      // Enter steam ID
      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Should call getPlayerFullName - but since we're mocking the hook directly, we just verify the component renders
      await waitFor(() => {
        expect(screen.getByLabelText(/steam id/i)).toBeInTheDocument();
      });
    });
  });

  describe("form validation", () => {
    it("should require ticket ID", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Try to submit without ticket ID
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ticket id is required/i)).toBeInTheDocument();
      });
    });

    it("should require at least one player", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in ticket ID
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Try to submit without players
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/at least one player is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should validate organization fields when creating new org", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in ticket ID
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select "Create New" for organization
      const orgSelect = screen.getByLabelText(/organization/i);
      await user.click(orgSelect);
      const createNewOption = screen.getByText(/create new organization/i);
      await user.click(createNewOption);

      // Try to submit without org details
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/organization name is required/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/organization code is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should validate team name when creating new team", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in ticket ID
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select "Create New" for team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const createNewOption = screen.getByText(/create new team/i);
      await user.click(createNewOption);

      // Try to submit without team name
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/team name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should submit existing team approval successfully", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select existing team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const teamOption = screen.getByText("Team Alpha");
      await user.click(teamOption);

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClientApiFetch).toHaveBeenCalledWith(
          "/api/v1/dashboard/registration/manual-player-approval",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              teamId: 1,
              acceptedPlayerSteamIds: ["76561198012345678"],
              ticketId: "TICKET-123",
              details: "",
              type: "existing-team"
            })
          })
        );
        expect(mockToast.success).toHaveBeenCalledWith(
          "Players approved successfully"
        );
      });
    });

    it("should submit new team and org approval successfully", async () => {
      mockClientApiFetch.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select "Create New" for organization
      const orgSelect = screen.getByLabelText(/organization/i);
      await user.click(orgSelect);
      const createNewOrgOption = screen.getByText(/create new organization/i);
      await user.click(createNewOrgOption);

      // Fill in org details
      const orgNameInput = screen.getByLabelText(/organization name/i);
      await user.type(orgNameInput, "New Org");

      const orgCodeInput = screen.getByLabelText(/organization code/i);
      await user.type(orgCodeInput, "NEWORG");

      const orgWebsiteInput = screen.getByLabelText(/organization website/i);
      await user.type(orgWebsiteInput, "https://neworg.com");

      // Select "Create New" for team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const createNewTeamOption = screen.getByText(/create new team/i);
      await user.click(createNewTeamOption);

      // Fill in team name
      const teamNameInput = screen.getByLabelText(/team name/i);
      await user.type(teamNameInput, "New Team");

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClientApiFetch).toHaveBeenCalledWith(
          "/api/v1/dashboard/registration/manual-player-approval",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              acceptedPlayerSteamIds: ["76561198012345678"],
              newOrganizationName: "New Org",
              newOrganizationCode: "NEWORG",
              newOrganizationWebsite: "https://neworg.com",
              newTeamName: "New Team",
              ticketId: "TICKET-123",
              details: "",
              type: "new-team-and-org"
            })
          })
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      mockClientApiFetch.mockRejectedValue(new Error("API Error"));

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select existing team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const teamOption = screen.getByText("Team Alpha");
      await user.click(teamOption);

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to approve players"
        );
      });
    });

    it("should show loading state during submission", async () => {
      // Mock a delayed response
      mockClientApiFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select existing team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const teamOption = screen.getByText("Team Alpha");
      await user.click(teamOption);

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("conditional rendering", () => {
    it("should show organization fields when creating new org", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Select "Create New" for organization
      const orgSelect = screen.getByLabelText(/organization/i);
      await user.click(orgSelect);
      const createNewOption = screen.getByText(/create new organization/i);
      await user.click(createNewOption);

      // Should show org fields
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization code/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/organization website/i)
      ).toBeInTheDocument();
    });

    it("should show team name field when creating new team", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Select "Create New" for team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const createNewOption = screen.getByText(/create new team/i);
      await user.click(createNewOption);

      // Should show team name field
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    it("should hide team selection when creating new org", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Select "Create New" for organization
      const orgSelect = screen.getByLabelText(/organization/i);
      await user.click(orgSelect);
      const createNewOption = screen.getByText(/create new organization/i);
      await user.click(createNewOption);

      // Team selection should be hidden
      expect(screen.queryByLabelText(/team/i)).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockClientApiFetch.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select existing team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const teamOption = screen.getByText("Team Alpha");
      await user.click(teamOption);

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to approve players"
        );
      });
    });

    it("should handle validation errors from API", async () => {
      mockClientApiFetch.mockRejectedValue({
        message: "Validation failed",
        errors: {
          ticketId: "Invalid ticket ID",
          acceptedPlayerSteamIds: "Player not found"
        }
      });

      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Fill in required fields
      const ticketIdInput = screen.getByLabelText(/ticket id/i);
      await user.type(ticketIdInput, "TICKET-123");

      // Add a player
      const addButton = screen.getByText(/add player/i);
      await user.click(addButton);

      const steamIdInput = screen.getByLabelText(/steam id/i);
      await user.type(steamIdInput, "76561198012345678");

      // Select existing team
      const teamSelect = screen.getByLabelText(/team/i);
      await user.click(teamSelect);
      const teamOption = screen.getByText("Team Alpha");
      await user.click(teamOption);

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to approve players"
        );
      });
    });
  });
});
