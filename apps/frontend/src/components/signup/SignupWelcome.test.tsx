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

const mockSeason = createMockSeason({
  signup_start_date: new Date().toISOString(),
  signup_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
});

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
      isError: null,
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
        screen.getByText(/Finland's corporate CS2 tournament/i)
      ).toBeInTheDocument();

      expect(screen.getAllByText(/Participation Fee/i).length).toBeGreaterThan(
        0
      );

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
      const seasonWithEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate.toISOString()
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithExpiredEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: pastDate
      });

      const seasonDetailsWithExpiredEarlyBird = {
        ...seasonWithExpiredEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithExpiredEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithoutEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150
      });

      const seasonDetailsWithoutEarlyBird = {
        ...seasonWithoutEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithoutEarlyBird,
        isLoading: false,
        isError: null,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should not show early bird fee
      expect(screen.queryByText(/Early Bird Fee/i)).not.toBeInTheDocument();

      // Should show normal fee only
      expect(screen.getByText(/Normal Fee/i)).toBeInTheDocument();
      expect(screen.getByText(/150€/i)).toBeInTheDocument();
    });

    it("should use season payment_link when it is set", () => {
      const seasonWithPaymentLink = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        payment_link: "https://custom-payment.example.com/season-123",
        registration_price: 150
      });

      const seasonDetailsWithPaymentLink = {
        ...seasonWithPaymentLink,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithPaymentLink,
        isLoading: false,
        isError: null,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should use the custom payment link
      const paymentLink = screen.getByRole("link", {
        name: /custom-payment\.example\.com\/season-123/i
      });
      expect(paymentLink).toHaveAttribute(
        "href",
        "https://custom-payment.example.com/season-123"
      );
    });

    it("should use default payment link when season payment_link is not set", () => {
      const seasonWithoutPaymentLink = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150
      });

      const seasonDetailsWithoutPaymentLink = {
        ...seasonWithoutPaymentLink,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithoutPaymentLink,
        isLoading: false,
        isError: null,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should use the default payment link
      const paymentLink = screen.getByRole("link", {
        name: /www\.kanaliiga\.fi\/kauppa/i
      });
      expect(paymentLink).toHaveAttribute(
        "href",
        "https://www.kanaliiga.fi/kauppa"
      );
    });

    it("should not display early bird pricing when discount is 0", () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const seasonWithZeroDiscount = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        early_bird_price_discount: 0,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithZeroDiscount = {
        ...seasonWithZeroDiscount,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithZeroDiscount,
        isLoading: false,
        isError: null,
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
      const seasonWithInvalidDiscount = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        early_bird_price_discount: 1.0,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithInvalidDiscount = {
        ...seasonWithInvalidDiscount,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithInvalidDiscount,
        isLoading: false,
        isError: null,
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
      const seasonWithEarlyBird = createMockSeason({
        id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        platform: SeasonPlatform.Kanaliiga,
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: false,
        payment_link: null,
        registration_price: 150,
        has_vat: true,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 200,
        early_bird_price_discount: 0.1,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithNullPrice = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: null,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithNullPrice = {
        ...seasonWithNullPrice,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithNullPrice,
        isLoading: false,
        isError: null,
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
      const seasonWithEarlyBird = createMockSeason({
        id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        platform: SeasonPlatform.Kanaliiga,
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: false,
        payment_link: null,
        registration_price: 150,
        has_vat: true,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
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
      const seasonWithEarlyBird = createMockSeason({
        signup_start_date: new Date().toISOString(),
        signup_end_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        start_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        registration_price: 150,
        has_vat: false,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: futureDate
      });

      const seasonDetailsWithEarlyBird = {
        ...seasonWithEarlyBird,
        app_id: 730
      } satisfies SeasonDetails;

      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: seasonDetailsWithEarlyBird,
        isLoading: false,
        isError: null,
        isValidating: false
      });

      renderWithSWR(<SignupWelcome seasonId="1" />);

      // Should show +VAT information
      const vatTexts = screen.getAllByText(/\(\+VAT\)/i);
      expect(vatTexts.length).toBeGreaterThan(0);
    });
  });
});
