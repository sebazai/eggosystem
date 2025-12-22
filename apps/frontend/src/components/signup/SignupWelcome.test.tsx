import { screen } from "@testing-library/react";
import { SignupWelcome } from "./SignupWelcome";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import {
  SeasonPlatform,
  type SeasonDetails,
  createMockSeason
} from "@eggosystem/types";
import {
  renderWithSWR,
  setupFetchMock,
  clearAllMocks
} from "@/test-utils/test-utils";

jest.mock("@/context/AuthContext");
jest.mock("@/hooks/data/useSeasonDetails");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSeasonDetails = useSeasonDetails as jest.MockedFunction<
  typeof useSeasonDetails
>;

const mockSeason = createMockSeason(
  1,
  "Test Season",
  "Test Season Full Name",
  new Date().toISOString(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  SeasonPlatform.Kanaliiga,
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
);

const mockSeasonDetails = {
  ...mockSeason,
  app_id: 730
} satisfies SeasonDetails;

describe("SignupWelcome", () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock();

    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: mockSeasonDetails,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
  });

  describe("Welcome Page Display", () => {
    it("should show welcome page content when user is not logged in", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: jest.fn(),
        checkAuth: jest.fn()
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      expect(
        screen.getByText(/Welcome to Kanaliiga Test Season Full Name Sign Up!/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /Hi and Welcome to Kanaliiga, the biggest and the coolest CS2 tournament in Finland!/i
        )
      ).toBeInTheDocument();

      expect(screen.getByText(/💰 Participation Fee/i)).toBeInTheDocument();

      expect(screen.getByText(/📏 Rules/i)).toBeInTheDocument();

      expect(screen.getByText(/Login and register team!/i)).toBeInTheDocument();

      const registerButtons = screen.queryAllByRole("button", {
        name: /^Register team!$/i
      });
      expect(registerButtons).toHaveLength(0);
    });

    it("should show register button when user is logged in", () => {
      const mockUser = {
        account_id: 123,
        steam_id: "76561198000000000",
        nickname: "TestUser",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        acceptedNewsletter: true,
        isPersonalEmail: false,
        discordLinked: false,
        fullName: "Test User",
        workEmail: "test@example.com",
        discord: "testuser#1234",
        provider_id: "76561198000000000",
        provider: "steam" as const,
        roles: []
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        logout: jest.fn(),
        checkAuth: jest.fn()
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      expect(
        screen.getByText(/Welcome to Kanaliiga Test Season Full Name Sign Up!/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/Register team!/i)).toBeInTheDocument();

      expect(
        screen.queryByText(/Login and register team!/i)
      ).not.toBeInTheDocument();
    });
  });
});
