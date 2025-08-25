import { hasCaptainsAccess, getUserHighestRole } from "./roleUtils";
import type { UserFullPayload } from "@eggosystem/types";

describe("roleUtils", () => {
  describe("hasCaptainsAccess", () => {
    it("should return false for null user", () => {
      expect(hasCaptainsAccess(null)).toBe(false);
    });

    it("should return false for user without roles", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: [],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(false);
    });

    it("should return true for user with admin role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["admin"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(true);
    });

    it("should return true for user with captain role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["captain"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(true);
    });

    it("should return true for user with helpdesk role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["helpdesk"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(true);
    });

    it("should return true for user with multiple roles including required ones", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["player", "captain", "moderator"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(true);
    });

    it("should return false for user with other roles", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["player", "moderator"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(hasCaptainsAccess(user)).toBe(false);
    });
  });

  describe("getUserHighestRole", () => {
    it("should return null for null user", () => {
      expect(getUserHighestRole(null)).toBe(null);
    });

    it("should return null for user without roles", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: [],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe(null);
    });

    it("should return admin for user with admin role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["admin"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("admin");
    });

    it("should return helpdesk for user with helpdesk role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["helpdesk"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("helpdesk");
    });

    it("should return captain for user with captain role", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["captain"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("captain");
    });

    it("should return admin when user has multiple roles including admin", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["captain", "admin", "helpdesk"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("admin");
    });

    it("should return helpdesk when user has helpdesk and captain roles", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["captain", "helpdesk"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("helpdesk");
    });

    it("should return first role when user has no hierarchy roles", () => {
      const user: UserFullPayload = {
        account_id: 1,
        provider_id: "123",
        roles: ["player", "moderator"],
        nickname: "test",
        provider: "steam",
        acceptedPrivacyPolicy: true,
        acceptedMarketing: false,
        isPersonalEmail: false,
        discordLinked: false
      };
      expect(getUserHighestRole(user)).toBe("player");
    });
  });
});
