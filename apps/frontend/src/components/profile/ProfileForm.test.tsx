import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileForm from "@/components/profile/ProfileForm";
import { useAccountDetails } from "@/hooks/data/user/useAccountDetails";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import { clientApiFetch } from "@/lib/apiClient";
import { createMockUser } from "@/test-utils/test-utils";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/profile"
}));

// Mocks
jest.mock("@/hooks/data/user/useAccountDetails", () => ({
  useAccountDetails: jest.fn()
}));
jest.mock("@/hooks/data/useEmailsVerified", () => ({
  useEmailsVerified: jest.fn()
}));
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));
jest.mock("swr", () => ({
  useSWRConfig: () => ({
    mutate: jest.fn()
  })
}));
jest.mock("@/components/profile/SteamLoginButton", () => ({
  SteamLoginButton: () => (
    <button data-testid="steam-login">Login with Steam</button>
  )
}));
jest.mock("@/components/profile/EmailVerifiedIcon", () => ({
  EmailVerifiedIcon: () => <span data-testid="email-verified-icon">✓</span>
}));

// Mock icons with a simple implementation
jest.mock("@/components/ui/icons", () => ({
  TooltipIcon: ({ text }: { text: string }) => (
    <span data-testid="tooltip-icon" title={text}>
      ?
    </span>
  )
}));

jest.mock("@/components/layout/ContentContainer", () => ({
  ContentContainer: ({
    children,
    classNames
  }: {
    children: React.ReactNode;
    classNames?: string;
  }) => (
    <div data-testid="content-container" className={classNames}>
      {children}
    </div>
  )
}));

jest.mock("@/components/ui/RequiredFormLabel", () => ({
  RequiredFormLabel: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <label {...props} data-testid="required-form-label">
      {children}
    </label>
  )
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Polyfill ResizeObserver for jsdom (Radix UI needs this)
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

describe("ProfileForm", () => {
  const mockCheckAuth = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useEmailsVerified to avoid destructure error
    (useEmailsVerified as jest.Mock).mockReturnValue({ emailsVerified: {} });
  });

  it("renders loading state", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({ isLoading: true });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "TestUser",
      acceptedPrivacyPolicy: true
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it("renders login prompt and button if unauthenticated", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: null
    });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "TestUser",
      acceptedPrivacyPolicy: true
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      expect(screen.getByTestId("steam-login")).toBeInTheDocument();
    });
  });

  it("renders the form for authenticated user", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com"
        }
      }
    });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "TestUser",
      acceptedPrivacyPolicy: true
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("TestUser")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@user.com")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument();
    });
  });

  it("submits the form and shows success message", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com"
        }
      }
    });
    (clientApiFetch as jest.Mock).mockResolvedValue({
      message: "Profile updated!"
    });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "TestUser",
      acceptedPrivacyPolicy: true
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("TestUser")).toBeInTheDocument();
    });

    // Fill in the form with valid data
    fireEvent.change(screen.getByPlaceholderText(/your kana nickname/i), {
      target: { value: "NewNick" }
    });
    fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
      target: { value: "New Name" }
    });
    fireEvent.change(screen.getByPlaceholderText(/john.doe@kanaliiga.fi/i), {
      target: { value: "new@user.com" }
    });

    // Make sure privacy policy is checked (it should be already checked based on user data)
    const privacyCheckbox = screen.getByTestId("privacy-policy-checkbox");
    if (!privacyCheckbox.getAttribute("data-state")?.includes("checked")) {
      fireEvent.click(privacyCheckbox);
    }

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByTestId("profile-success-message")).toHaveTextContent(
        "Profile updated!"
      );
    });
  });

  it("shows validation errors", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: { details: { fullName: "", workEmail: "" } }
    });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "",
      acceptedPrivacyPolicy: false
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Nickname is required")).toBeInTheDocument();
      expect(
        screen.getByText("Too small: expected string to have >=2 characters")
      ).toBeInTheDocument();
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(
        screen.getByText("You must accept the privacy policy")
      ).toBeInTheDocument();
    });
  });

  it("shows privacy policy error if not accepted", async () => {
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com"
        }
      }
    });

    const mockUser = createMockUser({
      account_id: 1,
      nickname: "TestUser",
      acceptedPrivacyPolicy: false
    });

    render(<ProfileForm user={mockUser} checkAuth={mockCheckAuth} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(
        screen.getByText("You must accept the privacy policy")
      ).toBeInTheDocument();
    });
  });
});
