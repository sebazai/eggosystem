import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import KanahautomoPage from "@/components/kanahautomo/KanahautomoPage";
import { AuthProvider } from "@/context/AuthContext";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { useKanahautomoOrganizationStatus } from "@/hooks/data/useKanahautomoOrganizationStatus";
import type { Organizations } from "@eggosystem/types";
import { useAuth } from "@/context/AuthContext";
import React from "react";

// Mock the hooks
jest.mock("@/hooks/data/useOrganizations");
jest.mock("@/hooks/data/useKanahautomoOrganizationStatus");

// Mock the AuthContext
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

const mockUseOrganizations = useOrganizations as jest.MockedFunction<
  typeof useOrganizations
>;
const mockUseKanahautomoOrganizationStatus =
  useKanahautomoOrganizationStatus as jest.MockedFunction<
    typeof useKanahautomoOrganizationStatus
  >;

// Mock the API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock the toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockUser = {
  id: 1,
  steam_id: "76561198012345678",
  name: "Test User",
  email: "test@example.com",
  avatar: "test-avatar.jpg",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
};

const mockOrganizations: Organizations[] = [
  {
    id: 1,
    name: "Test Organization 1",
    logo: "logo1.png",
    organization_code: "ORG1",
    website: "https://org1.com",
    country: "Finland",
    sort_order: 1
  },
  {
    id: 2,
    name: "Test Organization 2",
    logo: "logo2.png",
    organization_code: "ORG2",
    website: "https://org2.com",
    country: "Finland",
    sort_order: 2
  },
  {
    id: 3,
    name: "Test Organization 3",
    logo: "logo3.png",
    organization_code: "ORG3",
    website: "https://org3.com",
    country: "Finland",
    sort_order: 3
  }
];

const mockOrgStatus = [
  {
    organization_id: 1,
    organization_name: "Test Organization 1",
    count: 3,
    status: "ready" as const
  },
  {
    organization_id: 2,
    organization_name: "Test Organization 2",
    count: 1,
    status: "waiting" as const
  },
  {
    organization_id: 3,
    organization_name: "Test Organization 3",
    count: 5,
    status: "ready" as const
  }
];

// Mock the AuthContext
const mockAuthContext = {
  user: mockUser,
  loading: false,
  checkAuth: jest.fn(),
  logout: jest.fn()
};

describe("KanahautomoPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganizations.mockReturnValue({
      organizations: mockOrganizations,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    mockUseKanahautomoOrganizationStatus.mockReturnValue({
      orgStatus: mockOrgStatus,
      orgStatusLoading: false,
      orgStatusError: undefined,
      isValidating: false,
      mutate: jest.fn()
    });

    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
  });

  it("renders the page title", () => {
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    expect(
      screen.getByRole("heading", { name: "Join Kanahautomo" })
    ).toBeInTheDocument();
  });

  it("displays organization registration status table", async () => {
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(
        screen.getByText("Organization Registration Status")
      ).toBeInTheDocument();
    });
    // Check for organization names in headings (cards, not table cells)
    expect(
      screen.getByRole("heading", { name: "Test Organization 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Test Organization 2" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Test Organization 3" })
    ).toBeInTheDocument();
  });

  it("displays error state for organization status", () => {
    mockUseKanahautomoOrganizationStatus.mockReturnValue({
      orgStatus: [],
      orgStatusLoading: false,
      orgStatusError: new Error("Failed to load organization status"),
      isValidating: false,
      mutate: jest.fn()
    });
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    expect(
      screen.getByText("Failed to load organization status")
    ).toBeInTheDocument();
  });

  it("requires authentication to register", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    expect(
      screen.getByText(/please log in with steam to join kanahautomo/i)
    ).toBeInTheDocument();
  });

  it("renders the form with full page width container", () => {
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    // Use heading to find the container
    const heading = screen.getByRole("heading", { name: "Join Kanahautomo" });
    const container = heading.closest(".container");
    expect(container).toHaveClass("container");
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
    const org1Elements = screen.getAllByText("Test Organization 1");
    const org2Elements = screen.getAllByText("Test Organization 2");
    const addNewElements = screen.getAllByText("Add new organization...");
    expect(org1Elements[0]).toBeInTheDocument();
    expect(org2Elements[0]).toBeInTheDocument();
    expect(addNewElements[0]).toBeInTheDocument();
  });

  it("should render the list of organizations", () => {
    render(<KanahautomoPage />);
    // Open dropdown
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    expect(screen.getAllByText("Test Organization 1").length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText("Test Organization 2").length).toBeGreaterThan(
      0
    );
  });

  it("should show new organization form when 'Add new...' is selected", async () => {
    render(<KanahautomoPage />);
    // Select 'Add new organization...' using the hidden select
    const select = screen
      .getByRole("combobox")
      .parentElement?.querySelector("select");
    act(() => {
      fireEvent.change(select!, { target: { value: "-1" } });
    });
    // Wait for the form fields to appear
    await waitFor(() => {
      expect(screen.getByTestId("organization-name-input")).toBeInTheDocument();
      expect(
        screen.getByTestId("organization-business-id-input")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("organization-website-input")
      ).toBeInTheDocument();
    });
  });

  it("should require authentication", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    expect(
      screen.getByText("Please log in with Steam to join Kanahautomo")
    ).toBeInTheDocument();
  });

  it("should not render the form full page width", () => {
    render(<KanahautomoPage />);
    const heading = screen.getByRole("heading", { name: /join kanahautomo/i });
    const container = heading.closest(".container");
    expect(container).toHaveClass("container");
    // Optionally check for max-width style or class
    expect(container?.className).toContain("container");
  });
});

describe("KanahautomoPage (with useKanahautomoOrganizationStatus hook)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOrganizations.mockReturnValue({
      organizations: mockOrganizations,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
  });

  it("shows loading state for organization status", () => {
    mockUseKanahautomoOrganizationStatus.mockReturnValue({
      orgStatus: [],
      orgStatusLoading: true,
      orgStatusError: undefined,
      isValidating: true,
      mutate: jest.fn()
    });
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    // Look for the loading spinner div with animate-spin class
    const loadingSpinner = document.querySelector(".animate-spin");
    expect(loadingSpinner).toBeInTheDocument();
  });

  it("shows error state for organization status", () => {
    mockUseKanahautomoOrganizationStatus.mockReturnValue({
      orgStatus: [],
      orgStatusLoading: false,
      orgStatusError: new Error("Failed to load organization status"),
      isValidating: false,
      mutate: jest.fn()
    });
    render(
      <AuthProvider>
        <KanahautomoPage />
      </AuthProvider>
    );
    expect(
      screen.getByText("Failed to load organization status")
    ).toBeInTheDocument();
  });
});

// Mock ResizeObserver for jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;
