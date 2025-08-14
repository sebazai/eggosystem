import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualPlayerApprovalForm } from "./ManualPlayerApprovalForm";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { usePlayerFullName } from "@/hooks/data/dashboard/usePlayerFullName";

jest.mock("@/hooks/data/dashboard/useSelectableTeams");
jest.mock("@/hooks/data/dashboard/useSelectableOrgs");
jest.mock("@/hooks/data/dashboard/usePlayerFullName");

const mockUseSelectableTeams = useSelectableTeams as jest.MockedFunction<
  typeof useSelectableTeams
>;
const mockUseSelectableOrgs = useSelectableOrgs as jest.MockedFunction<
  typeof useSelectableOrgs
>;
const mockUsePlayerFullName = usePlayerFullName as jest.MockedFunction<
  typeof usePlayerFullName
>;

describe("ManualPlayerApprovalForm", () => {
  const mockTeams = [{ id: 1, name: "Team Alpha", organization_id: 1 }];
  const mockOrgs = [{ id: 1, name: "Org Alpha", organization_code: "ALPHA" }];
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
    it("should render form fields", () => {
      render(<ManualPlayerApprovalForm />);

      expect(
        screen.getByText("Select Organization or Create New")
      ).toBeInTheDocument();
      expect(screen.getByText("Select Team or Create New")).toBeInTheDocument();
      expect(screen.getByText("Ticket Number")).toBeInTheDocument();
      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(screen.getByText("Add player")).toBeInTheDocument();
    });

    it("should render submit and reset buttons", () => {
      render(<ManualPlayerApprovalForm />);

      expect(screen.getByText("Submit")).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });
  });

  describe("player management", () => {
    it("should add player when add button is clicked", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      const addButton = screen.getByText("Add player");
      await user.click(addButton);

      expect(
        screen.getByText("Accepted Player Steam ID #1")
      ).toBeInTheDocument();
      expect(screen.getByText("Remove")).toBeInTheDocument();
    });

    it("should remove player when remove button is clicked", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Add a player first
      const addButton = screen.getByText("Add player");
      await user.click(addButton);

      // Then remove it
      const removeButton = screen.getByText("Remove");
      await user.click(removeButton);

      expect(
        screen.queryByText("Accepted Player Steam ID #1")
      ).not.toBeInTheDocument();
    });

    it("should add multiple players", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      // Add first player
      const addButton = screen.getByText("Add player");
      await user.click(addButton);

      // Add second player
      await user.click(addButton);

      expect(
        screen.getByText("Accepted Player Steam ID #1")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Accepted Player Steam ID #2")
      ).toBeInTheDocument();
      expect(screen.getAllByText("Remove")).toHaveLength(2);
    });
  });

  describe("form validation", () => {
    it("should show validation error when submitting without players", async () => {
      const user = userEvent.setup();
      render(<ManualPlayerApprovalForm />);

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      // Should show validation error
      const validationErrors = screen.getAllByText(
        "Either Team or Organization has to be selected"
      );
      expect(validationErrors).toHaveLength(2);
    });
  });

  describe("form fields", () => {
    it("should have ticket ID input", () => {
      render(<ManualPlayerApprovalForm />);

      const ticketInput = screen.getByTestId("ticket-id-input");
      expect(ticketInput).toBeInTheDocument();
      expect(ticketInput).toHaveAttribute(
        "placeholder",
        "Insert optional ticket id"
      );
    });

    it("should have details textarea", () => {
      render(<ManualPlayerApprovalForm />);

      const detailsInput = screen.getByTestId("details-input");
      expect(detailsInput).toBeInTheDocument();
      expect(detailsInput).toHaveAttribute(
        "placeholder",
        "Insert optional details"
      );
    });
  });

  describe("select components", () => {
    it("should render organization select with options", () => {
      render(<ManualPlayerApprovalForm />);

      expect(screen.getByText("Select an organization")).toBeInTheDocument();
    });

    it("should render team select with options", () => {
      render(<ManualPlayerApprovalForm />);

      expect(screen.getByText("Select a team")).toBeInTheDocument();
    });
  });
});
