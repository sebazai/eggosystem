import {
  hasCaptainsAccess,
  getUserHighestRole,
  hasCasterAccess
} from "./roleUtils";
import type { UserFullPayload } from "@eggosystem/types";

describe("roleUtils", () => {
  const mockUser: UserFullPayload = {
    account_id: 1,
    provider_id: "12345",
    roles: ["player"],
    nickname: "testuser",
    provider: "steam" as const,
    acceptedPrivacyPolicy: true,
    acceptedMarketing: false,
    isPersonalEmail: false,
    discordLinked: false
  };

  describe("hasCasterAccess", () => {
    it("should return true for user with caster role", () => {
      const casterUser = { ...mockUser, roles: ["caster"] };
      expect(hasCasterAccess(casterUser)).toBe(true);
    });

    it("should return true for user with multiple roles including caster", () => {
      const multiRoleUser = {
        ...mockUser,
        roles: ["player", "caster", "admin"]
      };
      expect(hasCasterAccess(multiRoleUser)).toBe(true);
    });

    it("should return false for user without caster role", () => {
      const playerUser = { ...mockUser, roles: ["player"] };
      expect(hasCasterAccess(playerUser)).toBe(false);
    });

    it("should return false for user with empty roles array", () => {
      const noRoleUser = { ...mockUser, roles: [] };
      expect(hasCasterAccess(noRoleUser)).toBe(false);
    });

    it("should return false for null user", () => {
      expect(hasCasterAccess(null)).toBe(false);
    });

    it("should return false for user without roles property", () => {
      const userWithoutRoles = {
        ...mockUser,
        roles: undefined
      } as unknown as UserFullPayload;
      expect(hasCasterAccess(userWithoutRoles)).toBe(false);
    });
  });

  describe("hasCaptainsAccess (existing test coverage)", () => {
    it("should return true for user with captain role", () => {
      const captainUser = { ...mockUser, roles: ["captain"] };
      expect(hasCaptainsAccess(captainUser)).toBe(true);
    });

    it("should return true for user with admin role", () => {
      const adminUser = { ...mockUser, roles: ["admin"] };
      expect(hasCaptainsAccess(adminUser)).toBe(true);
    });

    it("should return true for user with helpdesk role", () => {
      const helpdeskUser = { ...mockUser, roles: ["helpdesk"] };
      expect(hasCaptainsAccess(helpdeskUser)).toBe(true);
    });

    it("should return true for user with caster role", () => {
      const casterUser = { ...mockUser, roles: ["caster"] };
      expect(hasCaptainsAccess(casterUser)).toBe(true);
    });

    it("should return false for user with only player role", () => {
      const playerUser = { ...mockUser, roles: ["player"] };
      expect(hasCaptainsAccess(playerUser)).toBe(false);
    });

    it("should return false for null user", () => {
      expect(hasCaptainsAccess(null)).toBe(false);
    });
  });

  describe("getUserHighestRole (existing test coverage)", () => {
    it("should return admin as highest role", () => {
      const adminUser = {
        ...mockUser,
        roles: ["captain", "admin", "helpdesk"]
      };
      expect(getUserHighestRole(adminUser)).toBe("admin");
    });

    it("should return helpdesk when no admin role", () => {
      const helpdeskUser = { ...mockUser, roles: ["captain", "helpdesk"] };
      expect(getUserHighestRole(helpdeskUser)).toBe("helpdesk");
    });

    it("should return captain when no higher roles", () => {
      const captainUser = { ...mockUser, roles: ["captain", "player"] };
      expect(getUserHighestRole(captainUser)).toBe("captain");
    });

    it("should return first role when no hierarchy roles", () => {
      const playerUser = { ...mockUser, roles: ["player", "caster"] };
      expect(getUserHighestRole(playerUser)).toBe("player");
    });

    it("should return null for empty roles", () => {
      const noRoleUser = { ...mockUser, roles: [] };
      expect(getUserHighestRole(noRoleUser)).toBe(null);
    });

    it("should return null for null user", () => {
      expect(getUserHighestRole(null)).toBe(null);
    });
  });
});
