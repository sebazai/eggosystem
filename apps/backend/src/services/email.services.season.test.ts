import { sendSeasonCaptainWelcomeEmail } from "./email.services";
import { getSeasonById } from "../models/season.models";
import { getGameById } from "../models/game.models";
import { SeasonPlatform } from "@eggosystem/types";

// Shared mock transporter and sendMail
const mockSendMail = jest.fn();
const mockTransporter = { sendMail: mockSendMail };

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

// Mock dependencies
jest.mock("../models/season.models");
jest.mock("../models/game.models");
jest.mock("../utils/app-logger");

const mockGetSeasonById = getSeasonById as jest.MockedFunction<
  typeof getSeasonById
>;
const mockGetGameById = getGameById as jest.MockedFunction<typeof getGameById>;

beforeAll(() => {
  process.env.NODE_ENV = "development";
  process.env.FRONTEND_URL = "https://test.example.com";
});

describe("Season Captain Welcome Email Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPlayers = [
    { nickname: "Player1", steam_id: "76561198000000001" },
    { nickname: "Player2", steam_id: "76561198000000002" }
  ];

  const mockGame = {
    id: 1,
    name: "Counter-Strike 2",
    abbreviation: "CS2",
    app_id: 730
  };

  describe("sendSeasonCaptainWelcomeEmail", () => {
    it("should include payment link in email when season has payment_link", async () => {
      const paymentLink = "https://example.com/payment/season1";
      const mockSeason = {
        id: 1,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: "2024-01-01T00:00:00Z",
        signup_end_date: "2024-01-15T23:59:59Z",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: false,
        payment_link: paymentLink,
        registration_price: 150,
        has_vat: true,
        early_bird_price_discount: null,
        early_bird_price_discount_end_date: null
      };

      mockGetSeasonById.mockResolvedValue(mockSeason);
      mockGetGameById.mockResolvedValue(mockGame);

      await sendSeasonCaptainWelcomeEmail(
        "captain@example.com",
        1,
        "https://discord.gg/test",
        mockPlayers
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(1);
      expect(mockSendMail).toHaveBeenCalled();

      const emailContent = mockSendMail.mock.calls[0][0].html;

      // Verify payment link is included in the email
      expect(emailContent).toContain("Payment Required");
      expect(emailContent).toContain(paymentLink);
      expect(emailContent).toContain("Pay Participation Fee");
      expect(emailContent).toContain(`href="${paymentLink}"`);
    });

    it("should not include payment section when season has no payment_link", async () => {
      const mockSeason = {
        id: 1,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: "2024-01-01T00:00:00Z",
        signup_end_date: "2024-01-15T23:59:59Z",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: false,
        payment_link: null,
        registration_price: null,
        has_vat: true,
        early_bird_price_discount: null,
        early_bird_price_discount_end_date: null
      };

      mockGetSeasonById.mockResolvedValue(mockSeason);
      mockGetGameById.mockResolvedValue(mockGame);

      await sendSeasonCaptainWelcomeEmail(
        "captain@example.com",
        1,
        "https://discord.gg/test",
        mockPlayers
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(1);
      expect(mockSendMail).toHaveBeenCalled();

      const emailContent = mockSendMail.mock.calls[0][0].html;

      // Verify payment section is NOT included
      expect(emailContent).not.toContain("Payment Required");
      expect(emailContent).not.toContain("Pay Participation Fee");
    });

    it("should use the payment_link from the season fetched from database", async () => {
      const expectedPaymentLink =
        "https://custom-payment.example.com/season-123";
      const mockSeason = {
        id: 123,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Season 123",
        full_name: "Full Season 123 Name",
        signup_start_date: "2024-01-01T00:00:00Z",
        signup_end_date: "2024-01-15T23:59:59Z",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.FACEIT,
        is_round_robin_bo2_as_2xbo1: true,
        grand_final_round_one_only: false,
        payment_link: expectedPaymentLink,
        registration_price: 200,
        has_vat: false,
        early_bird_price_discount: 0.2,
        early_bird_price_discount_end_date: "2024-01-10T23:59:59Z"
      };

      mockGetSeasonById.mockResolvedValue(mockSeason);
      mockGetGameById.mockResolvedValue(mockGame);

      await sendSeasonCaptainWelcomeEmail(
        "captain@example.com",
        123,
        "https://discord.gg/test",
        mockPlayers
      );

      // Verify that getSeasonById was called with the correct season ID
      expect(mockGetSeasonById).toHaveBeenCalledWith(123);

      const emailContent = mockSendMail.mock.calls[0][0].html;

      // Verify the exact payment link from the season is used
      expect(emailContent).toContain(expectedPaymentLink);
      expect(emailContent).toContain(`href="${expectedPaymentLink}"`);
    });

    it("should throw error when season is not found", async () => {
      mockGetSeasonById.mockResolvedValue(undefined);

      await expect(
        sendSeasonCaptainWelcomeEmail(
          "captain@example.com",
          999,
          "https://discord.gg/test",
          mockPlayers
        )
      ).rejects.toThrow("Season with id 999 not found");

      expect(mockGetSeasonById).toHaveBeenCalledWith(999);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
