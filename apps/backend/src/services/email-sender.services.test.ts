import { sendSeasonWelcomeEmail } from "./email-sender.services";
import nodemailer from "nodemailer";
import { getOrCreateUnsubscribeToken } from "../models/user-policy-acceptance.models";

// Mock nodemailer
jest.mock("nodemailer");

// Mock user-policy-acceptance models
jest.mock("../models/user-policy-acceptance.models", () => ({
  getOrCreateUnsubscribeToken: jest.fn()
}));

describe("Email Sender Services", () => {
  let mockSendMail: jest.Mock;
  let mockTransporter: { sendMail: jest.Mock };
  let originalEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save and set NODE_ENV to non-test value for most tests
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // Setup mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-id" });
    mockTransporter = { sendMail: mockSendMail };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    (getOrCreateUnsubscribeToken as jest.Mock).mockResolvedValue(
      "test-token-123"
    );
  });

  afterEach(() => {
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe("sendSeasonWelcomeEmail", () => {
    const baseEmailParams = {
      to: "player@example.com",
      accountId: 123,
      seasonDisplayName: "Season 1 - CS2",
      seasonStartDate: "January 1, 2024",
      teamName: "Test Team",
      leagueName: "Masters",
      platform: "Kanaliiga",
      rulebookUrl: "https://example.com/rules",
      discordLink: "https://discord.gg/test",
      mapNames: ["Dust2", "Mirage", "Inferno"]
    };

    it("should send email with all parameters", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0][0];

      // Verify basic email structure
      expect(mailOptions.from).toBe("Kanahub by Kanaliiga <cs@kanaliiga.fi>");
      expect(mailOptions.to).toBe(baseEmailParams.to);
      expect(mailOptions.cc).toBe("cs@kanaliiga.fi");
      expect(mailOptions.subject).toBe("Welcome to Season 1 - CS2 - Kanaliiga");
    });

    it("should include unsubscribe headers", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      expect(getOrCreateUnsubscribeToken).toHaveBeenCalledWith(
        baseEmailParams.accountId
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.headers["List-Unsubscribe"]).toContain(
        "test-token-123"
      );
      expect(mailOptions.headers["List-Unsubscribe-Post"]).toBe(
        "List-Unsubscribe=One-Click"
      );
    });

    it("should include unsubscribe link in email body", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("test-token-123");
      expect(mailOptions.html).toContain("Unsubscribe");
    });

    it("should include season start date when provided", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("January 1, 2024");
      expect(mailOptions.html).toContain("The season starts on");
    });

    it("should omit season start date when null", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        null, // No start date
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).not.toContain("The season starts on");
    });

    it("should include team and league information", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("Test Team");
      expect(mailOptions.html).toContain("Masters");
      expect(mailOptions.html).toContain("Kanaliiga");
    });

    it("should include map pool when provided", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("Active Map Pool");
      expect(mailOptions.html).toContain("Dust2, Mirage, Inferno");
    });

    it("should omit map pool section when no maps provided", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        [] // No maps
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).not.toContain("Active Map Pool");
    });

    it("should include Discord link when provided", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("Join the Community");
      expect(mailOptions.html).toContain("https://discord.gg/test");
      expect(mailOptions.html).toContain("Join Discord Server");
    });

    it("should omit Discord section when link is null", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        null, // No Discord link
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).not.toContain("Join the Community");
      expect(mailOptions.html).not.toContain("Join Discord Server");
    });

    it("should include rulebook link when provided", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain("Important Information");
      expect(mailOptions.html).toContain("https://example.com/rules");
      expect(mailOptions.html).toContain("View Rulebook");
    });

    it("should omit rulebook section when link is null", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        null, // No rulebook link
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.html).not.toContain("View Rulebook");
    });

    it("should include standard email headers", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.headers.Date).toBeDefined();
      expect(mailOptions.headers["Message-ID"]).toContain("@kanaliiga.fi");
      expect(mailOptions.headers["Content-Type"]).toBe(
        "text/html; charset=UTF-8"
      );
    });

    it("should include footer with current year", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      const mailOptions = mockSendMail.mock.calls[0][0];
      const currentYear = new Date().getFullYear();
      expect(mailOptions.html).toContain(`&copy; ${currentYear} Kanaliiga`);
      expect(mailOptions.html).toContain("hub.kanaliiga.fi");
      expect(mailOptions.html).toContain("kanaliiga.fi");
    });

    it("should handle minimal configuration (no optional fields)", async () => {
      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        null, // No start date
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        null, // No rulebook
        null, // No Discord
        [] // No maps
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe(baseEmailParams.to);
      expect(mailOptions.html).toContain(baseEmailParams.teamName);
      expect(mailOptions.html).toContain(baseEmailParams.leagueName);
    });

    it("should not send email in test environment", async () => {
      // Set NODE_ENV to test
      process.env.NODE_ENV = "test";

      await sendSeasonWelcomeEmail(
        baseEmailParams.to,
        baseEmailParams.accountId,
        baseEmailParams.seasonDisplayName,
        baseEmailParams.seasonStartDate,
        baseEmailParams.teamName,
        baseEmailParams.leagueName,
        baseEmailParams.platform,
        baseEmailParams.rulebookUrl,
        baseEmailParams.discordLink,
        baseEmailParams.mapNames
      );

      // Should not throw error even with undefined transporter
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should propagate errors from nodemailer", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP connection failed"));

      await expect(
        sendSeasonWelcomeEmail(
          baseEmailParams.to,
          baseEmailParams.accountId,
          baseEmailParams.seasonDisplayName,
          baseEmailParams.seasonStartDate,
          baseEmailParams.teamName,
          baseEmailParams.leagueName,
          baseEmailParams.platform,
          baseEmailParams.rulebookUrl,
          baseEmailParams.discordLink,
          baseEmailParams.mapNames
        )
      ).rejects.toThrow("SMTP connection failed");
    });

    it("should propagate errors from unsubscribe token generation", async () => {
      (getOrCreateUnsubscribeToken as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        sendSeasonWelcomeEmail(
          baseEmailParams.to,
          baseEmailParams.accountId,
          baseEmailParams.seasonDisplayName,
          baseEmailParams.seasonStartDate,
          baseEmailParams.teamName,
          baseEmailParams.leagueName,
          baseEmailParams.platform,
          baseEmailParams.rulebookUrl,
          baseEmailParams.discordLink,
          baseEmailParams.mapNames
        )
      ).rejects.toThrow("Database error");
    });
  });
});
