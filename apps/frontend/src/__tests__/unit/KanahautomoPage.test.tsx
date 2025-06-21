import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KanahautomoPage from "@/components/kanahautomo/KanahautomoPage";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { clientApiFetch } from "@/lib/apiClient";

// Mock the hooks and API
jest.mock("@/context/AuthContext");
jest.mock("@/hooks/data/useOrganizations");
jest.mock("@/lib/apiClient");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseOrganizations = useOrganizations as jest.MockedFunction<
  typeof useOrganizations
>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;

// Add this to the top of the file to mock scrollIntoView for all tests
window.HTMLElement.prototype.scrollIntoView = function () {};

// Mock ResizeObserver for jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

describe("KanahautomoPage", () => {
  const mockUser = {
    account_id: 1,
    provider_id: "76561198000000001",
    nickname: "TestUser",
    provider: "steam" as const,
    roles: [],
    acceptedPrivacyPolicy: true,
    acceptedMarketing: false,
    isPersonalEmail: false
  };

  const mockOrganizations = [
    {
      id: 1,
      name: "Test Org 1",
      organization_code: "1234567-8",
      website: "https://test1.com",
      logo: "",
      country: "FI",
      sort_order: null
    },
    {
      id: 2,
      name: "Test Org 2",
      organization_code: "8765432-1",
      website: "https://test2.com",
      logo: "",
      country: "FI",
      sort_order: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockUseOrganizations.mockReturnValue({
      organizations: mockOrganizations,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    mockClientApiFetch.mockResolvedValue({
      message: "Successfully registered for Kanahautomo",
      registration_id: 123
    });
  });

  it("should render the page with organization selection", () => {
    render(<KanahautomoPage />);
    // Heading
    expect(
      screen.getByRole("heading", { name: /join kanahautomo/i })
    ).toBeInTheDocument();
    // Button
    expect(
      screen.getByRole("button", { name: /join kanahautomo/i })
    ).toBeInTheDocument();
    // Label
    expect(screen.getByText("Select your organization")).toBeInTheDocument();
    // Select trigger
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should show organization dropdown with existing organizations", () => {
    render(<KanahautomoPage />);
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();
    // Click to open dropdown
    fireEvent.click(selectTrigger);
    // Check that organizations are available as options (use getAllByText and take first)
    const org1Elements = screen.getAllByText("Test Org 1");
    const org2Elements = screen.getAllByText("Test Org 2");
    const addNewElements = screen.getAllByText("Add new organization...");
    expect(org1Elements[0]).toBeInTheDocument();
    expect(org2Elements[0]).toBeInTheDocument();
    expect(addNewElements[0]).toBeInTheDocument();
  });

  it("should show new organization form when 'Add new...' is selected", async () => {
    render(<KanahautomoPage />);
    // Open dropdown and select "Add new organization..."
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    const addNewElements = screen.getAllByText("Add new organization...");
    expect(addNewElements[0]).toBeInTheDocument();
    fireEvent.click(addNewElements[0]!);
    // Close dropdown by clicking outside
    fireEvent.click(document.body);
    // Wait for the form to appear - check for the form fields directly
    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });
  });

  it("should register for Kanahautomo with existing organization", async () => {
    mockClientApiFetch.mockResolvedValueOnce({
      message: "Successfully registered for Kanahautomo",
      registration_id: 123
    });
    render(<KanahautomoPage />);
    // Open dropdown and select first organization
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    const orgElements = screen.getAllByText("Test Org 1");
    expect(orgElements[0]).toBeInTheDocument();
    fireEvent.click(orgElements[0]!);
    // Close dropdown by clicking outside
    fireEvent.click(document.body);
    // Wait for validation
    await waitFor(() => {
      expect(
        screen.queryByText("Please select an organization or create a new one")
      ).not.toBeInTheDocument();
    });
    const registerButton = screen.getByRole("button", {
      name: /join kanahautomo/i
    });
    fireEvent.click(registerButton);
    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/kanahautomo/register",
        {
          method: "POST",
          body: JSON.stringify({ organization_id: 1 })
        }
      );
    });
  });

  it("should create new organization and register for Kanahautomo", async () => {
    mockClientApiFetch
      .mockResolvedValueOnce({ id: 3, name: "New Org" })
      .mockResolvedValueOnce({
        message: "Successfully registered for Kanahautomo",
        registration_id: 123
      });
    render(<KanahautomoPage />);
    // Open dropdown and select "Add new organization..."
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    const addNewElements = screen.getAllByText("Add new organization...");
    expect(addNewElements[0]).toBeInTheDocument();
    fireEvent.click(addNewElements[0]!);
    // Close dropdown by clicking outside
    fireEvent.click(document.body);
    // Wait for the form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });
    // Fill new organization form
    fireEvent.change(screen.getByLabelText(/organization name/i), {
      target: { value: "New Organization" }
    });
    fireEvent.change(screen.getByLabelText(/business id/i), {
      target: { value: "1234567-8" }
    });
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: "https://neworg.com" }
    });
    // Wait for validation
    await waitFor(() => {
      expect(
        screen.queryByText("Please select an organization or create a new one")
      ).not.toBeInTheDocument();
    });
    const registerButton = screen.getByRole("button", {
      name: /join kanahautomo/i
    });
    fireEvent.click(registerButton);
    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith("/api/v1/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: "New Organization",
          organization_code: "1234567-8",
          website: "https://neworg.com"
        })
      });
    });
  });

  it("should show error message when registration fails", async () => {
    mockClientApiFetch.mockRejectedValueOnce(
      new Error("Player is already registered for Kanahautomo")
    );
    render(<KanahautomoPage />);
    // Open dropdown and select first organization
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    const orgElements = screen.getAllByText("Test Org 1");
    expect(orgElements[0]).toBeInTheDocument();
    fireEvent.click(orgElements[0]!);
    // Close dropdown by clicking outside
    fireEvent.click(document.body);
    // Wait for validation
    await waitFor(() => {
      expect(
        screen.queryByText("Please select an organization or create a new one")
      ).not.toBeInTheDocument();
    });
    const registerButton = screen.getByRole("button", {
      name: /join kanahautomo/i
    });
    fireEvent.click(registerButton);
    await waitFor(() => {
      expect(
        screen.getByText("Player is already registered for Kanahautomo")
      ).toBeInTheDocument();
    });
  });

  it("should show loading state while registering", async () => {
    mockClientApiFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ message: "Success", registration_id: 123 } satisfies {
                message: string;
                registration_id: number;
              }),
            100
          )
        )
    );
    render(<KanahautomoPage />);
    // Open dropdown and select first organization
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    const orgElements = screen.getAllByText("Test Org 1");
    expect(orgElements[0]).toBeInTheDocument();
    fireEvent.click(orgElements[0]!);
    // Close dropdown by clicking outside
    fireEvent.click(document.body);
    // Wait for validation
    await waitFor(() => {
      expect(
        screen.queryByText("Please select an organization or create a new one")
      ).not.toBeInTheDocument();
    });
    const registerButton = screen.getByRole("button", {
      name: /join kanahautomo/i
    });
    fireEvent.click(registerButton);
    // Should show loading state
    expect(screen.getByText("Joining...")).toBeInTheDocument();
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText("Joining...")).not.toBeInTheDocument();
    });
  });

  it("should require authentication", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });
    render(<KanahautomoPage />);
    expect(
      screen.getByText("Please log in with Steam to join Kanahautomo")
    ).toBeInTheDocument();
  });
});
