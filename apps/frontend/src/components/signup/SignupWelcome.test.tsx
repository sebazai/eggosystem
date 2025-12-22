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

  describe("Early Bird Pricing", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
    });

    it("should display early bird pricing when discount is active", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150, // registration_price
        true, // has_vat
        0.2, // 20% discount
        futureDate // end date in future
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show early bird fee with discounted price
      expect(screen.getByText(/Early Bird Fee/i)).toBeInTheDocument();
      expect(screen.getByText(/120€/i)).toBeInTheDocument(); // 150 * (1 - 0.2) = 120

      // Should show original price crossed out
      expect(screen.getByText(/\(was 150€\)/i)).toBeInTheDocument();

      // Should show normal fee crossed out
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
    });

    it("should display early bird pricing with expiration date when active", () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true,
        0.2,
        futureDate.toISOString()
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show expiration message
      expect(
        screen.getByText(/Early bird pricing ends on/i)
      ).toBeInTheDocument();
    });

    it("should not display early bird pricing when discount end date has passed", () => {
      const pastDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithExpiredEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true,
        0.2, // discount exists
        pastDate // but end date is in the past
      );

      const seasonDetailsWithExpiredEarlyBird = {
        ...seasonWithExpiredEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithExpiredEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should not show early bird fee
      expect(screen.queryByText(/Early Bird Fee/i)).not.toBeInTheDocument();

      // Should show normal fee only
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
      expect(screen.getByText(/150€/i)).toBeInTheDocument();
    });

    it("should not display early bird pricing when discount is not configured", () => {
      const seasonWithoutEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true,
        null, // no discount
        null // no end date
      );

      const seasonDetailsWithoutEarlyBird = {
        ...seasonWithoutEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithoutEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should not show early bird fee
      expect(screen.queryByText(/Early Bird Fee/i)).not.toBeInTheDocument();

      // Should show normal fee only
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
      expect(screen.getByText(/150€/i)).toBeInTheDocument();
    });

    it("should not display early bird pricing when discount is 0", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithZeroDiscount = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true,
        0, // invalid discount (0)
        futureDate
      );

      const seasonDetailsWithZeroDiscount = {
        ...seasonWithZeroDiscount,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithZeroDiscount,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should not show early bird fee
      expect(screen.queryByText(/Early Bird Fee/i)).not.toBeInTheDocument();

      // Should show normal fee only
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
    });

    it("should not display early bird pricing when discount is >= 1", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithInvalidDiscount = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true,
        1.0, // invalid discount (>= 1)
        futureDate
      );

      const seasonDetailsWithInvalidDiscount = {
        ...seasonWithInvalidDiscount,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithInvalidDiscount,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should not show early bird fee
      expect(screen.queryByText(/Early Bird Fee/i)).not.toBeInTheDocument();

      // Should show normal fee only
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
    });

    it("should calculate early bird discount correctly (20% off 150€ = 120€)", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150, // registration_price
        true,
        0.2, // 20% discount
        futureDate
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show discounted price (150 * 0.8 = 120)
      expect(screen.getByText(/120€/i)).toBeInTheDocument();
    });

    it("should calculate early bird discount correctly (10% off 200€ = 180€)", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        200, // registration_price
        true,
        0.1, // 10% discount
        futureDate
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show discounted price (200 * 0.9 = 180)
      expect(screen.getByText(/180€/i)).toBeInTheDocument();
    });

    it("should use default price of 150€ when registration_price is null", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithNullPrice = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        null, // null registration_price
        true,
        0.2, // 20% discount
        futureDate
      );

      const seasonDetailsWithNullPrice = {
        ...seasonWithNullPrice,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithNullPrice,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should use default 150€ and apply discount (150 * 0.8 = 120)
      expect(screen.getByText(/120€/i)).toBeInTheDocument();
      expect(screen.getByText(/\(was 150€\)/i)).toBeInTheDocument();
    });

    it("should display VAT information with early bird pricing", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        true, // has_vat
        0.2,
        futureDate
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show VAT information
      const vatTexts = screen.getAllByText(/\(includes VAT\)/i);
      expect(vatTexts.length).toBeGreaterThan(0);
    });

    it("should display '+VAT' when has_vat is false with early bird pricing", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithEarlyBird = createMockSeason(
        1,
        "Test Season",
        "Test Season Full Name",
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        SeasonPlatform.Kanaliiga,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        1,
        1,
        1,
        false,
        false,
        null,
        150,
        false, // has_vat = false
        0.2,
        futureDate
      );

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show +VAT information
      const vatTexts = screen.getAllByText(/\(\+VAT\)/i);
      expect(vatTexts.length).toBeGreaterThan(0);
    });
  });
});
