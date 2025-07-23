import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanahautomoPage from "@/components/kanahautomo/KanahautomoPage";
import { AuthProvider } from "@/context/AuthContext";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { useKanahautomoOrganizationStatus } from "@/hooks/data/useKanahautomoOrganizationStatus";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { clientApiFetch } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

// Mock the hooks
jest.mock("@/hooks/data/useOrganizations");
jest.mock("@/hooks/data/useKanahautomoOrganizationStatus");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/test-path"),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn()
  }))
}));

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
  updated_at: "2024-01-01T00:00:00Z",
  discordLinked: false
};

// Memoized mock return values
const stableMockOrganizations = [
  {
    id: 1,
    name: "Test Organization 1",
    logo: "logo1.png",
    organization_code: "ORG1",
    website: "https://org1.com",
    country: "Finland",
    sort_order: 1,
    discord_invite_link: "https://discord.com/invite/test"
  },
  {
    id: 2,
    name: "Test Organization 2",
    logo: "logo2.png",
    organization_code: "ORG2",
    website: "https://org2.com",
    country: "Finland",
    sort_order: 2,
    discord_invite_link: null
  },
  {
    id: 3,
    name: "Test Organization 3",
    logo: "logo3.png",
    organization_code: "ORG3",
    website: "https://org3.com",
    country: "Finland",
    sort_order: 3,
    discord_invite_link: null
  }
];
const stableMockOrgStatus = [
  {
    organization_id: 1,
    organization_name: "Test Organization 1",
    total_registrations: 3,
    game_type_counts: {
      cs: 2,
      csWingman: 1,
      pubgDuo: 0,
      pubgSquad: 0,
      rocketLeague: 0,
      dota: 0
    }
  },
  {
    organization_id: 2,
    organization_name: "Test Organization 2",
    total_registrations: 1,
    game_type_counts: {
      cs: 0,
      csWingman: 0,
      pubgDuo: 1,
      pubgSquad: 0,
      rocketLeague: 0,
      dota: 0
    }
  },
  {
    organization_id: 3,
    organization_name: "Test Organization 3",
    total_registrations: 5,
    game_type_counts: {
      cs: 2,
      csWingman: 1,
      pubgDuo: 1,
      pubgSquad: 1,
      rocketLeague: 0,
      dota: 0
    }
  }
];
const stableMockAuthContext = {
  user: mockUser,
  loading: false,
  checkAuth: jest.fn(),
  logout: jest.fn()
};

// Mock scrollIntoView for Command component
const mockScrollIntoView = jest.fn();
Object.defineProperty(window.Element.prototype, "scrollIntoView", {
  value: mockScrollIntoView,
  writable: true
});

// Mock ResizeObserver for jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

const renderKanahautomoPage = () => {
  return render(
    <AuthProvider>
      <KanahautomoPage />
    </AuthProvider>
  );
};

describe("KanahautomoPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScrollIntoView.mockClear();
    mockUseOrganizations.mockReturnValue({
      organizations: stableMockOrganizations,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseKanahautomoOrganizationStatus.mockReturnValue({
      orgStatus: stableMockOrgStatus,
      orgStatusLoading: false,
      orgStatusError: undefined,
      isValidating: false,
      mutate: jest.fn()
    });
    (useAuth as jest.Mock).mockReturnValue(stableMockAuthContext);
  });

  describe("Basic Rendering", () => {
    it("renders the page title", () => {
      renderKanahautomoPage();
      expect(
        screen.getByRole("heading", { name: "Join Kanahautomo" })
      ).toBeInTheDocument();
    });

    it("renders the page description", () => {
      renderKanahautomoPage();
      expect(
        screen.getByText(
          /Register for Kanahautomo to find teammates from your organization/
        )
      ).toBeInTheDocument();
    });

    it("renders the form with full page width container", () => {
      renderKanahautomoPage();
      const heading = screen.getByRole("heading", { name: "Join Kanahautomo" });
      const container = heading.closest("div[class*='mx-auto']");
      expect(container).toHaveClass("mx-auto", "px-4", "py-8");
    });

    it("renders the submit button", () => {
      renderKanahautomoPage();
      expect(
        screen.getByRole("button", { name: "Join Kanahautomo" })
      ).toBeInTheDocument();
    });
  });

  describe("Authentication States", () => {
    it("requires authentication to register", () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        checkAuth: jest.fn(),
        logout: jest.fn()
      });
      renderKanahautomoPage();
      expect(
        screen.getByText(/please log in with steam to join kanahautomo/i)
      ).toBeInTheDocument();
    });

    it("shows loading state when auth is loading", () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        checkAuth: jest.fn(),
        logout: jest.fn()
      });
      renderKanahautomoPage();
      const loadingSpinner = document.querySelector(".animate-spin");
      expect(loadingSpinner).toBeInTheDocument();
    });

    it("shows form when user is authenticated", () => {
      renderKanahautomoPage();
      expect(screen.getByText("Select your organization")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Organization Loading States", () => {
    it("shows loading state when organizations are loading", () => {
      mockUseOrganizations.mockReturnValue({
        organizations: undefined,
        isLoading: true,
        isError: undefined,
        isValidating: false
      });
      renderKanahautomoPage();
      const loadingSpinner = document.querySelector(".animate-spin");
      expect(loadingSpinner).toBeInTheDocument();
    });

    it("shows error state when organizations fail to load", () => {
      mockUseOrganizations.mockReturnValue({
        organizations: undefined,
        isLoading: false,
        isError: new Error("Failed to load organizations"),
        isValidating: false
      });
      renderKanahautomoPage();
      expect(
        screen.getByText(
          "Failed to load organizations. This might be a temporary issue."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Organization Selection", () => {
    it("renders organization selection dropdown", () => {
      renderKanahautomoPage();
      expect(screen.getByText("Select your organization")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("shows 'Choose an organization...' as default text", () => {
      renderKanahautomoPage();
      expect(screen.getByText("Choose an organization...")).toBeInTheDocument();
    });

    it("opens organization dropdown when clicked", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      // Check that the dropdown content is visible
      expect(screen.getByText("Add new organization...")).toBeInTheDocument();
      // Use getAllByText to handle multiple elements with same text
      const org1Elements = screen.getAllByText("Test Organization 1");
      const org2Elements = screen.getAllByText("Test Organization 2");
      expect(org1Elements.length).toBeGreaterThan(0);
      expect(org2Elements.length).toBeGreaterThan(0);
    });

    it("allows selecting an existing organization", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      // Select an organization from the dropdown (use getAllByText and get the first one which should be the dropdown option)
      const orgOptions = screen.getAllByText("Test Organization 1");
      expect(orgOptions[0]).toBeDefined();
      await user.click(orgOptions[0]!); // First one should be the dropdown option
      // Check that the selected organization is displayed in the combobox
      expect(screen.getByText("Test Organization 1")).toBeInTheDocument();
    });

    it("shows 'Add new organization...' option", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(screen.getByText("Add new organization...")).toBeInTheDocument();
    });
  });

  describe("New Organization Form", () => {
    it("shows new organization form when 'Add new organization...' is selected", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.click(screen.getByText("Add new organization..."));
      // Check that the form fields appear
      await waitFor(() => {
        expect(
          screen.getByTestId("organization-name-input")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("organization-business-id-input")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("organization-website-input")
        ).toBeInTheDocument();
      });
    });

    it("hides new organization form when existing organization is selected", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      // First select "Add new organization..."
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.click(screen.getByText("Add new organization..."));
      // Verify form is visible
      await waitFor(() => {
        expect(
          screen.getByTestId("organization-name-input")
        ).toBeInTheDocument();
      });
      // Now select an existing organization - click the combobox again to open dropdown
      await user.click(combobox);
      // Find the organization option in the dropdown (not in the status cards)
      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Test Organization 1");
        // Find the one that's in the command item (dropdown)
        const dropdownOption = dropdownOptions.find(
          (el) =>
            el.getAttribute("data-value") === "Test Organization 1" ||
            el.closest('[role="option"]') ||
            el.closest("[cmdk-item]")
        );
        expect(dropdownOption).toBeDefined();
        return dropdownOption;
      });
      // Click on the dropdown option
      const dropdownOptions = screen.getAllByText("Test Organization 1");
      const dropdownOption = dropdownOptions.find(
        (el) =>
          el.getAttribute("data-value") === "Test Organization 1" ||
          el.closest('[role="option"]') ||
          el.closest("[cmdk-item]")
      );
      await user.click(dropdownOption!);
      // Wait for the form to be hidden - the watchOrganizationId should no longer be -1
      await waitFor(
        () => {
          expect(
            screen.queryByTestId("organization-name-input")
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Game Types Selection", () => {
    it("renders all game type checkboxes", () => {
      renderKanahautomoPage();

      expect(screen.getByText("Select Game Types")).toBeInTheDocument();
      expect(screen.getByText("Counter-Strike 2")).toBeInTheDocument();
      expect(screen.getByText("PUBG")).toBeInTheDocument();
      expect(screen.getByText("Other Games")).toBeInTheDocument();

      // Check for specific game types
      expect(screen.getByText("CS2 Comp")).toBeInTheDocument();
      expect(screen.getByText("CS2 Wingman")).toBeInTheDocument();
      expect(screen.getByText("PUBG Squad")).toBeInTheDocument();
      expect(screen.getByText("PUBG Duo")).toBeInTheDocument();
      expect(screen.getByText("Rocket League Standard")).toBeInTheDocument();
      expect(screen.getByText("Dota 2 Team Clash")).toBeInTheDocument();
    });

    it("allows toggling game type checkboxes", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const cs2Checkbox = screen.getByLabelText("CS2 Comp");
      const pubgCheckbox = screen.getByLabelText("PUBG Squad");
      // Initially unchecked
      expect(cs2Checkbox).not.toBeChecked();
      expect(pubgCheckbox).not.toBeChecked();
      // Check them
      await user.click(cs2Checkbox);
      await user.click(pubgCheckbox);
      // Now checked
      expect(cs2Checkbox).toBeChecked();
      expect(pubgCheckbox).toBeChecked();
    });
  });

  describe("Terms and Conditions", () => {
    it("renders terms consent checkbox", () => {
      renderKanahautomoPage();
      const termsCheckbox = screen.getByRole("checkbox", {
        name: /I consent to my Steam ID, nickname, and organization/i
      });
      expect(termsCheckbox).toBeInTheDocument();
    });

    it("allows toggling terms checkbox", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      const termsCheckbox = screen.getByRole("checkbox", {
        name: /I consent to my Steam ID, nickname, and organization/i
      });
      // Initially unchecked
      expect(termsCheckbox).not.toBeChecked();
      // Check it
      await user.click(termsCheckbox);
      await waitFor(() => expect(termsCheckbox).toBeChecked());
    });
  });

  describe("Form Submission", () => {
    it("disables submit button when form is submitting", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();
      // Fill required fields first - select organization
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      // Select an existing organization from dropdown
      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Test Organization 1");
        const dropdownOption = dropdownOptions.find(
          (el) =>
            el.getAttribute("data-value") === "Test Organization 1" ||
            el.closest('[role="option"]') ||
            el.closest("[cmdk-item]")
        );
        expect(dropdownOption).toBeDefined();
        return dropdownOption;
      });
      const dropdownOptions = screen.getAllByText("Test Organization 1");
      const dropdownOption = dropdownOptions.find(
        (el) =>
          el.getAttribute("data-value") === "Test Organization 1" ||
          el.closest('[role="option"]') ||
          el.closest("[cmdk-item]")
      );
      await user.click(dropdownOption!);
      // Select a game type
      const cs2Checkbox = screen.getByLabelText(/CS2 Comp/i);
      await user.click(cs2Checkbox);
      // Accept terms
      const termsCheckbox = screen.getByRole("checkbox", {
        name: /I consent to my Steam ID, nickname, and organization/i
      });
      await user.click(termsCheckbox);
      // Wait for form to be valid
      await waitFor(() => {
        expect(cs2Checkbox).toBeChecked();
        expect(termsCheckbox).toBeChecked();
      });
      // Mock API call to hang (never resolves) to keep form in submitting state
      let resolveApiCall: () => void;
      const apiPromise = new Promise<void>((resolve) => {
        resolveApiCall = resolve;
      });
      (clientApiFetch as jest.Mock).mockReturnValue(apiPromise);
      // Submit form
      const submitButton = screen.getByTestId("kanahautomo-submit");
      await user.click(submitButton);
      // Button should be disabled and show loading text
      await waitFor(
        () => {
          expect(submitButton).toBeDisabled();
          expect(submitButton).toHaveTextContent("Registering...");
        },
        { timeout: 2000 }
      );
      // Clean up - resolve the promise to avoid hanging
      resolveApiCall!();
    });

    it("shows error message when submission fails", async () => {
      const user = userEvent.setup();
      const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
        typeof clientApiFetch
      >;
      mockClientApiFetch.mockRejectedValueOnce(
        new Error("Registration failed")
      );

      renderKanahautomoPage();

      // Fill out the form completely according to the Zod schema
      // 1. Select an existing organization (organizationId > 0)
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      // Wait for the dropdown options to appear and select the correct one
      const orgOptions = await screen.findAllByText(
        "Test Organization 1",
        {},
        { timeout: 1000 }
      );
      // Find the dropdown option with role="option"
      const dropdownOption = orgOptions.find(
        (el) => el.getAttribute("role") === "option"
      );
      expect(dropdownOption).toBeDefined();
      await user.click(dropdownOption!);

      // 2. Do NOT provide newOrganization (leave new org fields empty)
      // 3. Select at least one game type (e.g., CS2 Comp)
      const cs2Checkbox = screen.getByLabelText("CS2 Comp");
      await user.click(cs2Checkbox);

      // 4. Accept terms
      const termsCheckbox = screen.getByLabelText(
        /I consent to my Steam ID, nickname, and organization being visible/
      );
      await user.click(termsCheckbox);

      // 5. Submit the form
      const submitButton = screen.getByRole("button", {
        name: "Join Kanahautomo"
      });
      await user.click(submitButton);

      // Should show error message - wait for the error to appear
      await waitFor(
        () => {
          const errorText = screen.getByText("Registration failed");
          expect(errorText).toBeInTheDocument();
          expect(errorText).toHaveClass("text-red-500", "text-sm");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Organization Status Section", () => {
    it("displays organization registration status section", () => {
      renderKanahautomoPage();
      expect(
        screen.getByText("Organization Registration Status")
      ).toBeInTheDocument();
    });

    it("shows loading state for organization status", () => {
      mockUseKanahautomoOrganizationStatus.mockReturnValue({
        orgStatus: [],
        orgStatusLoading: true,
        orgStatusError: undefined,
        isValidating: true,
        mutate: jest.fn()
      });
      renderKanahautomoPage();

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
      renderKanahautomoPage();

      expect(
        screen.getByText("Failed to load organization status")
      ).toBeInTheDocument();
    });

    it("displays organization status cards", () => {
      renderKanahautomoPage();

      // Check for organization names in the status cards
      expect(screen.getByText("Test Organization 1")).toBeInTheDocument();
      expect(screen.getByText("Test Organization 2")).toBeInTheDocument();
      expect(screen.getByText("Test Organization 3")).toBeInTheDocument();

      // Check for registration counts
      expect(screen.getByText("Total: 3")).toBeInTheDocument();
      expect(screen.getByText("Total: 1")).toBeInTheDocument();
      expect(screen.getByText("Total: 5")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires organization selection", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();

      // Try to submit without selecting organization
      const submitButton = screen.getByRole("button", {
        name: "Join Kanahautomo"
      });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(
            "Please select an existing organization or create a new one."
          )
        ).toBeInTheDocument();
      });
    });

    it("requires at least one game type selection", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();

      // Select organization but no game types
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      const orgOptions = screen.getAllByText("Test Organization 1");
      expect(orgOptions[0]).toBeDefined();
      await user.click(orgOptions[0]!);

      const submitButton = screen.getByRole("button", {
        name: "Join Kanahautomo"
      });
      await user.click(submitButton);

      // Should show validation error for game types - look specifically for the validation message
      await waitFor(() => {
        const validationMessages = screen.getAllByText(
          "Please select at least one game type"
        );
        expect(validationMessages.length).toBeGreaterThan(0);
        expect(validationMessages[0]).toBeInTheDocument();
      });
    });

    it("requires terms acceptance", async () => {
      const user = userEvent.setup();
      renderKanahautomoPage();

      // Select organization and game type but not terms
      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      const orgOptions = screen.getAllByText("Test Organization 1");
      expect(orgOptions[0]).toBeDefined();
      await user.click(orgOptions[0]!);

      const cs2Checkbox = screen.getByLabelText("CS2 Comp");
      await user.click(cs2Checkbox);

      const submitButton = screen.getByRole("button", {
        name: "Join Kanahautomo"
      });
      await user.click(submitButton);

      // Should show validation error for terms - check for the actual message
      await waitFor(() => {
        expect(
          screen.getByText("You must accept the terms and conditions")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Discord Linking", () => {
    it("shows Link Discord Account button when Discord is not linked", () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...stableMockAuthContext,
        user: { ...mockUser, discordLinked: false }
      });
      renderKanahautomoPage();

      // There should be two elements: the section title (h3) and the button <span>
      const allLinkDiscordTexts = screen.getAllByText("Link Discord Account");
      // The button <span> should be present
      expect(allLinkDiscordTexts.length).toBeGreaterThan(1);
      // The "Not linked" status should be present
      expect(screen.getByText("Not linked")).toBeInTheDocument();
    });

    it("hides Link Discord Account button when Discord is already linked", () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...stableMockAuthContext,
        user: { ...mockUser, discordLinked: true }
      });
      renderKanahautomoPage();

      // The button <span> should not be present, only the section title (h3)
      const allLinkDiscordTexts = screen.getAllByText("Link Discord Account");
      // Only the section title should be present
      expect(allLinkDiscordTexts.length).toBe(1);
      expect(screen.getByText("✓ Discord linked")).toBeInTheDocument();
    });

    it("shows Discord linking section title and description", () => {
      renderKanahautomoPage();
      // The section title should always be present
      expect(
        screen.getByRole("heading", { name: "Link Discord Account" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Link your Discord account to automatically receive the correct role when you join the server/
        )
      ).toBeInTheDocument();
    });

    it("navigates to Discord OAuth when Link Discord Account button is clicked", async () => {
      const user = userEvent.setup();
      (useAuth as jest.Mock).mockReturnValue({
        ...stableMockAuthContext,
        user: { ...mockUser, discordLinked: false }
      });

      // Mock window.location
      const mockPush = jest.fn();
      const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
      mockUseRouter.mockReturnValue({
        push: mockPush,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
      });

      renderKanahautomoPage();

      // Find the button <span> (not the h3)
      const allLinkDiscordTexts = screen.getAllByText("Link Discord Account");
      // The button <span> is the one that is not a heading
      const buttonSpan = allLinkDiscordTexts.find(
        (el) => el.tagName.toLowerCase() === "span"
      );
      expect(buttonSpan).toBeDefined();
      await user.click(buttonSpan!);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/discord/login")
      );
    });
  });
});
