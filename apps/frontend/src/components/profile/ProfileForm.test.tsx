import { render, screen, waitFor } from "@testing-library/react";
import ProfileForm from "./ProfileForm";
import { useAccountDetails } from "@/hooks/data/user/useAccountDetails";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

// Mock hooks
jest.mock("@/hooks/data/user/useAccountDetails");
jest.mock("@/hooks/data/useEmailsVerified");

// Mock Next.js navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn()
}));

const mockUseAccountDetails = useAccountDetails as jest.MockedFunction<
  typeof useAccountDetails
>;
const mockUseEmailsVerified = useEmailsVerified as jest.MockedFunction<
  typeof useEmailsVerified
>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock useAuth - need to use a variable that can be updated
let mockUser = {
  account_id: 1,
  roles: ["user"],
  hasAcceptedPreviousPolicy: false
};

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    get user() {
      return mockUser;
    },
    loading: false,
    checkAuth: jest.fn(),
    logout: jest.fn()
  }))
}));

describe("ProfileForm - Error Message Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock user - ensure it's always defined
    mockUser = {
      account_id: 1,
      roles: ["user"],
      hasAcceptedPreviousPolicy: false
    } as any;
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: "/profile",
      query: {},
      asPath: "/profile"
    } as any);

    mockUsePathname.mockReturnValue("/profile");
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as any);

    mockUseAccountDetails.mockReturnValue({
      account: undefined,
      isLoading: false,
      isError: undefined,
      mutate: jest.fn(),
      isValidating: false
    });

    mockUseEmailsVerified.mockReturnValue({
      emailsVerified: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
  });

  it("should set error message when returnTo param exists and user hasn't accepted policy", async () => {
    const searchParams = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true&returnTo=/dashboard"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<ProfileForm user={mockUser as any} checkAuth={jest.fn()} />);

    await waitFor(() => {
      // Should set error message and replace URL
      expect(mockReplace).toHaveBeenCalledWith(
        "/profile?returnTo=%2Fdashboard",
        {
          scroll: false
        }
      );
    });
  });

  it("should set different error message when user has accepted previous policy", async () => {
    const searchParams = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true&returnTo=/dashboard"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);

    // Update mock user with hasAcceptedPreviousPolicy
    mockUser = {
      account_id: 1,
      roles: ["user"],
      hasAcceptedPreviousPolicy: true
    };

    render(<ProfileForm user={mockUser as any} checkAuth={jest.fn()} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/profile?returnTo=%2Fdashboard",
        {
          scroll: false
        }
      );
    });
  });

  it("should replace URL with returnTo param when present", async () => {
    const searchParams = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true&returnTo=/dashboard"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<ProfileForm user={mockUser as any} checkAuth={jest.fn()} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/profile?returnTo=%2Fdashboard",
        {
          scroll: false
        }
      );
    });
  });

  it("should replace URL without returnTo when not present", async () => {
    const searchParams = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<ProfileForm user={mockUser as any} checkAuth={jest.fn()} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/profile", {
        scroll: false
      });
    });
  });

  it("should update error message when searchParams change", async () => {
    // Ensure user is defined
    mockUser = {
      account_id: 1,
      roles: ["user"],
      hasAcceptedPreviousPolicy: false
    };

    const searchParams1 = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true"
    );
    mockUseSearchParams.mockReturnValue(searchParams1 as any);

    const { rerender } = render(
      <ProfileForm user={mockUser as any} checkAuth={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/profile", {
        scroll: false
      });
    });

    // Change searchParams to include returnTo
    const searchParams2 = new URLSearchParams(
      "acceptPrivacyPolicyRequired=true&returnTo=/new-path"
    );
    mockUseSearchParams.mockReturnValue(searchParams2 as any);
    mockReplace.mockClear();

    rerender(<ProfileForm user={mockUser as any} checkAuth={jest.fn()} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/profile?returnTo=%2Fnew-path",
        {
          scroll: false
        }
      );
    });
  });
});
