import {
  getLatestPolicyBySemver,
  getLatestNewsletterConsentBySemver,
  getLatestNewsletterConsentBySemverBatch,
  getOrCreateUnsubscribeToken,
  getAccountByUnsubscribeToken,
  unsubscribeFromNewsletter
} from "./user-policy-acceptance.models";
import { runQuery } from "../db/mysqlRunQuery";
import type { UserPolicyAcceptance } from "@eggosystem/types";
import { createMockUserPolicyAcceptance } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery");

describe("User Policy Acceptance Models", () => {
  describe("getLatestPolicyBySemver", () => {
    it("should return null for empty array", () => {
      const result = getLatestPolicyBySemver([]);
      expect(result).toBeNull();
    });

    it("should return the only policy if there's just one", () => {
      const policy = createMockUserPolicyAcceptance({
        id: 1,
        privacy_policy_version: "1.0.0"
      });

      const result = getLatestPolicyBySemver([policy]);
      expect(result).toEqual(policy);
    });

    it("should return the highest semver version when versions are in order", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "1.0.0",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "1.1.0",
          created_at: new Date("2024-02-01")
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          privacy_policy_version: "2.0.0",
          created_at: new Date("2024-03-01")
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(3);
      expect(result?.privacy_policy_version).toBe("2.0.0");
    });

    it("should return highest semver version even if created_at is earlier", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "1",
          created_at: new Date("2024-03-01") // Created AFTER version 1.1
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "1.1",
          created_at: new Date("2024-01-01") // Created BEFORE version 1
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(2);
      expect(result?.privacy_policy_version).toBe("1.1");
    });

    it("should handle database format versions (1, 1.1, 2) correctly", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "1"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          privacy_policy_version: "2"
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(3);
      expect(result?.privacy_policy_version).toBe("2");
    });

    it("should handle patch versions correctly", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "2.0.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          privacy_policy_version: "2.0.10"
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(3);
      expect(result?.privacy_policy_version).toBe("2.0.10");
    });

    it("should skip invalid semver versions", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "invalid"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          privacy_policy_version: "not-a-version"
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(2);
      expect(result?.privacy_policy_version).toBe("1.0.0");
    });

    it("should return null if all versions are invalid", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "invalid"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "not-a-version"
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result).toBeNull();
    });

    it("should handle major version jumps correctly", () => {
      const policies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          privacy_policy_version: "1.9.9"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          privacy_policy_version: "10.0.0"
        })
      ];

      const result = getLatestPolicyBySemver(policies);
      expect(result?.id).toBe(3);
      expect(result?.privacy_policy_version).toBe("10.0.0");
    });
  });

  describe("getLatestNewsletterConsentBySemver", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return true when latest semver version has accepted_tournament_newsletter = true", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-03-01"),
          updated_at: new Date("2024-03-01"),
          privacy_policy_version: "1.5.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM UserPolicyAcceptances WHERE account_id = ?",
        [1]
      );
    });

    it("should return false when latest semver version has accepted_tournament_newsletter = false", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0",
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should return false when no policy acceptances exist", async () => {
      mockRunQuery.mockResolvedValue(undefined);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should return false when empty array is returned", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should return false when no valid semver versions exist", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "invalid-version",
          created_at: new Date("2024-01-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should handle patch version correctly (e.g., 2.0.1 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.1",
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
    });

    it("should handle minor version correctly (e.g., 2.1.0 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.1.0",
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should handle major version correctly (e.g., 3.0.0 > 2.9.9)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.9.9",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "3.0.0",
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
    });

    it("should filter out invalid semver versions and use valid ones", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "invalid",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0",
          created_at: new Date("2024-02-01")
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "not-a-version",
          created_at: new Date("2024-03-01")
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
    });
  });

  describe("getLatestNewsletterConsentBySemverBatch", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return correct consent map for multiple accounts with different consent values", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.5.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM UserPolicyAcceptances WHERE account_id IN (?,?,?)",
        [1, 2, 3]
      );
    });

    it("should return correct consent map when accounts have multiple policies with different semver versions", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.5.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 5,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.1"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
    });

    it("should return empty map when accountIds array is empty", async () => {
      const result = await getLatestNewsletterConsentBySemverBatch([]);

      expect(result.size).toBe(0);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("should return map with all false values when no policies exist for any account", async () => {
      mockRunQuery.mockResolvedValue(undefined);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(false);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });

    it("should return map with all false values when empty array is returned", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(false);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });

    it("should handle single account correctly", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1]);

      expect(result.size).toBe(1);
      expect(result.get(1)).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM UserPolicyAcceptances WHERE account_id IN (?)",
        [1]
      );
    });

    it("should handle accounts with no policies (return false for those accounts)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle patch version correctly for multiple accounts (e.g., 2.0.1 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.1"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should filter out invalid semver versions and use valid ones for each account", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "invalid-version"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "not-a-version"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
    });

    it("should handle major version correctly for multiple accounts (e.g., 3.0.0 > 2.9.9)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.9.9"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "3.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.9.9"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "3.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle minor version correctly for multiple accounts (e.g., 1.1.0 > 1.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.1.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle database format versions (e.g., '1' and '1.1' instead of '1.0.0' and '1.1.0')", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 5,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 6,
          account_id: 3,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });
  });

  describe("getLatestNewsletterConsentBySemverBatch", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return correct consent map for multiple accounts with different consent values", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.5.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM UserPolicyAcceptances WHERE account_id IN (?,?,?)",
        [1, 2, 3]
      );
    });

    it("should return correct consent map when accounts have multiple policies with different semver versions", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.5.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 5,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.1"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
    });

    it("should return empty map when accountIds array is empty", async () => {
      const result = await getLatestNewsletterConsentBySemverBatch([]);

      expect(result.size).toBe(0);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("should return map with all false values when no policies exist for any account", async () => {
      mockRunQuery.mockResolvedValue(undefined);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(false);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });

    it("should return map with all false values when empty array is returned", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(false);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });

    it("should handle single account correctly", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1]);

      expect(result.size).toBe(1);
      expect(result.get(1)).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM UserPolicyAcceptances WHERE account_id IN (?)",
        [1]
      );
    });

    it("should handle accounts with no policies (return false for those accounts)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle patch version correctly for multiple accounts (e.g., 2.0.1 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.0.1"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should filter out invalid semver versions and use valid ones for each account", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "invalid-version"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "not-a-version"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(true);
    });

    it("should handle major version correctly for multiple accounts (e.g., 3.0.0 > 2.9.9)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2.9.9"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "3.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "2.9.9"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "3.0.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle minor version correctly for multiple accounts (e.g., 1.1.0 > 1.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1.0"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.0.0"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.1.0"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle database format versions (e.g., '1' and '1.1' instead of '1.0.0' and '1.1.0')", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1"
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1"
        }),
        createMockUserPolicyAcceptance({
          id: 4,
          account_id: 2,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 5,
          account_id: 3,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "1.1"
        }),
        createMockUserPolicyAcceptance({
          id: 6,
          account_id: 3,
          accepted_tournament_newsletter: false,
          privacy_policy_version: "2"
        })
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
      expect(result.get(3)).toBe(false);
    });
  });

  describe("getOrCreateUnsubscribeToken", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should generate a new token for user with single policy", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "1.0.0",
          newsletter_unsubscribe_token: null
        })
      ];

      mockRunQuery
        .mockResolvedValueOnce(mockPolicies)
        .mockResolvedValueOnce({ affectedRows: 1 });

      const token = await getOrCreateUnsubscribeToken(1);

      expect(token).toBeTruthy();
      expect(token).toHaveLength(64);
      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE UserPolicyAcceptances SET newsletter_unsubscribe_token = ? WHERE id = ?",
        [token, 1],
        undefined
      );
    });

    it("should return existing token if already generated", async () => {
      const existingToken = "a".repeat(64);
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "1.0.0",
          newsletter_unsubscribe_token: existingToken
        })
      ];

      mockRunQuery.mockResolvedValueOnce(mockPolicies);

      const token = await getOrCreateUnsubscribeToken(1);

      expect(token).toBe(existingToken);
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });

    it("should use highest semver version when multiple policies exist", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "1.0.0",
          newsletter_unsubscribe_token: null,
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          privacy_policy_version: "2.0.0",
          newsletter_unsubscribe_token: null,
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery
        .mockResolvedValueOnce(mockPolicies)
        .mockResolvedValueOnce({ affectedRows: 1 });

      const token = await getOrCreateUnsubscribeToken(1);

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE UserPolicyAcceptances SET newsletter_unsubscribe_token = ? WHERE id = ?",
        [token, 2],
        undefined
      );
    });

    it("should use highest semver version even if created_at is earlier", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "1",
          newsletter_unsubscribe_token: null,
          created_at: new Date("2024-03-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          privacy_policy_version: "1.1",
          newsletter_unsubscribe_token: null,
          created_at: new Date("2024-01-01")
        })
      ];

      mockRunQuery
        .mockResolvedValueOnce(mockPolicies)
        .mockResolvedValueOnce({ affectedRows: 1 });

      const token = await getOrCreateUnsubscribeToken(1);

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE UserPolicyAcceptances SET newsletter_unsubscribe_token = ? WHERE id = ?",
        [token, 2],
        undefined
      );
    });

    it("should return existing token from highest semver version policy", async () => {
      const existingToken = "b".repeat(64);
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "1.0.0",
          newsletter_unsubscribe_token: "oldtoken123",
          created_at: new Date("2024-01-01")
        }),
        createMockUserPolicyAcceptance({
          id: 2,
          account_id: 1,
          privacy_policy_version: "2.0.0",
          newsletter_unsubscribe_token: existingToken,
          created_at: new Date("2024-02-01")
        })
      ];

      mockRunQuery.mockResolvedValueOnce(mockPolicies);

      const token = await getOrCreateUnsubscribeToken(1);

      expect(token).toBe(existingToken);
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError if no policies exist", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(getOrCreateUnsubscribeToken(1)).rejects.toThrow(
        "No policy acceptance found for account"
      );
    });

    it("should throw NotFoundError if no valid semver versions found", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 1,
          privacy_policy_version: "invalid-version",
          newsletter_unsubscribe_token: null
        })
      ];

      mockRunQuery.mockResolvedValueOnce(mockPolicies);

      await expect(getOrCreateUnsubscribeToken(1)).rejects.toThrow(
        "No valid policy version found for account"
      );
    });
  });

  describe("getAccountByUnsubscribeToken", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return account_id for valid token", async () => {
      const token = "a".repeat(64);
      const mockPolicies: UserPolicyAcceptance[] = [
        createMockUserPolicyAcceptance({
          id: 1,
          account_id: 123,
          newsletter_unsubscribe_token: token
        })
      ];

      mockRunQuery.mockResolvedValueOnce(mockPolicies);

      const accountId = await getAccountByUnsubscribeToken(token);

      expect(accountId).toBe(123);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT account_id FROM UserPolicyAcceptances WHERE newsletter_unsubscribe_token = ? LIMIT 1",
        [token],
        undefined
      );
    });

    it("should return null for invalid token", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const accountId = await getAccountByUnsubscribeToken("invalid-token");

      expect(accountId).toBeNull();
    });

    it("should return null when no policies found", async () => {
      mockRunQuery.mockResolvedValueOnce(undefined);

      const accountId = await getAccountByUnsubscribeToken("some-token");

      expect(accountId).toBeNull();
    });
  });

  describe("unsubscribeFromNewsletter", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should set accepted_tournament_newsletter to false for all user policies", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 2 });

      await unsubscribeFromNewsletter(1);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "UPDATE UserPolicyAcceptances SET accepted_tournament_newsletter = 0 WHERE account_id = ?",
        [1],
        undefined
      );
    });

    it("should support transaction via connection parameter", async () => {
      const mockConnection = {} as PoolConnection;
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

      await unsubscribeFromNewsletter(1, mockConnection);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "UPDATE UserPolicyAcceptances SET accepted_tournament_newsletter = 0 WHERE account_id = ?",
        [1],
        mockConnection
      );
    });
  });
});
