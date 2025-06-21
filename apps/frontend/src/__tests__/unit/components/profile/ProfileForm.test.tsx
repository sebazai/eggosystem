import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileForm from "@/components/profile/ProfileForm";
import { useAuth } from "@/context/AuthContext";
import { useAccountDetails } from "@/hooks/data/user/useAccountDetails";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import { clientApiFetch } from "@/lib/apiClient";

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
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn()
}));
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
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useEmailsVerified to avoid destructure error
    (useEmailsVerified as jest.Mock).mockReturnValue({ emailsVerified: {} });
  });

  it("renders loading state", async () => {
    (useAuth as jest.Mock).mockReturnValue({ loading: true });
    (useAccountDetails as jest.Mock).mockReturnValue({ isLoading: true });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it("renders login prompt and button if unauthenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({ loading: false, user: null });
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: null
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      expect(screen.getByTestId("steam-login")).toBeInTheDocument();
    });
  });

  it("renders the form for authenticated user", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: { account_id: 1, nickname: "TestUser", acceptedPrivacyPolicy: true }
    });
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com",
          discord: "tester"
        }
      }
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("TestUser")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@user.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("tester")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument();
    });
  });

  it("submits the form and shows success message", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: {
        account_id: 1,
        nickname: "TestUser",
        acceptedPrivacyPolicy: true,
        checkAuth: jest.fn()
      }
    });
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com",
          discord: "tester"
        }
      }
    });
    (clientApiFetch as jest.Mock).mockResolvedValue({
      message: "Profile updated!"
    });

    render(<ProfileForm />);

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
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: { account_id: 1, nickname: "", acceptedPrivacyPolicy: false }
    });
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: { details: { fullName: "", workEmail: "", discord: "" } }
    });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Nickname is required")).toBeInTheDocument();
      expect(
        screen.getByText("String must contain at least 2 character(s)")
      ).toBeInTheDocument();
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
      expect(
        screen.getByText("You must accept the privacy policy")
      ).toBeInTheDocument();
    });
  });

  it("shows privacy policy error if not accepted", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: {
        account_id: 1,
        nickname: "TestUser",
        acceptedPrivacyPolicy: false
      }
    });
    (useAccountDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      account: {
        details: {
          fullName: "Test User",
          workEmail: "test@user.com",
          discord: "tester"
        }
      }
    });

    render(<ProfileForm />);

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
