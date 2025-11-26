import { sendDiscordInviteEmail } from "./email.services";

// Shared mock transporter and sendMail
const mockSendMail = jest.fn();
const mockTransporter = { sendMail: mockSendMail };

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

// Mock dependencies
jest.mock("../utils/app-logger");

beforeAll(() => {
  process.env.NODE_ENV = "development";
});

describe("Discord Email Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendDiscordInviteEmail", () => {
    it("should send Discord invite email with correct parameters", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive", "Rocket League"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
        to,
        subject: `Welcome to Kanahautomo Discord - ${organizationName}`,
        html: expect.stringContaining("Welcome to Kanahautomo"),
        headers: {
          Date: expect.any(String),
          "Message-ID": expect.stringMatching(/<.*@kanaliiga\.fi>/),
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    });

    it("should include organization name in email content", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(organizationName);
      expect(callArgs.subject).toContain(organizationName);
    });

    it("should include Discord invite link in email content", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(inviteUrl);
    });

    it("should include all game types in email content", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive", "Rocket League", "PUBG Squad"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      gameTypes.forEach((gameType) => {
        expect(callArgs.html).toContain(gameType);
      });
    });

    it("should handle single game type", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("CS2 Competitive");
    });

    it("should handle empty game types array", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes: string[] = [];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(
        "You have been registered for the following game types:"
      );
      expect(callArgs.html).toContain("<ul");
      expect(callArgs.html).toContain("</ul>");
    });

    it("should include proper email headers", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.headers).toEqual({
        Date: expect.any(String),
        "Message-ID": expect.stringMatching(/<.*@kanaliiga\.fi>/),
        "Content-Type": "text/html; charset=UTF-8"
      });
    });

    it("should handle email sending errors", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      // Mock sendMail to throw error
      mockSendMail.mockRejectedValueOnce(new Error("Email sending failed"));

      await expect(
        sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes)
      ).rejects.toThrow("Email sending failed");
    });

    it("should generate unique Message-ID for each email", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.headers["Message-ID"]).toMatch(/<.*@kanaliiga\.fi>/);
    });

    it("should include proper HTML structure", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("<div");
      expect(callArgs.html).toContain("<h1");
      expect(callArgs.html).toContain("<p>");
      expect(callArgs.html).toContain("<ul style=");
      expect(callArgs.html).toContain("<li style=");
      expect(callArgs.html).toContain("table width=");
      expect(callArgs.html).toContain("<a href=");
    });

    it("should include Discord branding colors", async () => {
      const to = "test@example.com";
      const organizationName = "Test Organization";
      const inviteUrl = "https://discord.gg/test-invite";
      const gameTypes = ["CS2 Competitive"];

      await sendDiscordInviteEmail(to, organizationName, inviteUrl, gameTypes);

      const callArgs = mockSendMail.mock.calls[0][0];
      // Check for Discord brand color (#5865F2)
      expect(callArgs.html).toContain("#5865F2");
    });
  });
});
