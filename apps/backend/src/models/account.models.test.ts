import {
  getLatestNewsletterConsentBySemver,
  getLatestNewsletterConsentBySemverBatch
} from "./account.models";
import { runQuery } from "../db/mysqlRunQuery";
import type { UserPolicyAcceptance } from "@eggosystem/types";
import { createMockUserPolicyAcceptance } from "@eggosystem/types";

jest.mock("../db/mysqlRunQuery");

describe("Account Models", () => {
  describe("getLatestNewsletterConsentBySemver", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return true when latest semver version has accepted_tournament_newsletter = true", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "1.0.0"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "2.0.0"
        },
        {
          id: 3,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-03-01"),
          updated_at: new Date("2024-03-01"),
          privacy_policy_version: "1.5.0"
        }
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
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "1.0.0"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "2.0.0"
        }
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
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "invalid-version"
        }
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should handle patch version correctly (e.g., 2.0.1 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "2.0.0"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "2.0.1"
        }
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
    });

    it("should handle minor version correctly (e.g., 2.1.0 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "2.0.0"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "2.1.0"
        }
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(false);
    });

    it("should handle major version correctly (e.g., 3.0.0 > 2.9.9)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "2.9.9"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "3.0.0"
        }
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      expect(result).toBe(true);
    });

    it("should filter out invalid semver versions and use valid ones", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        {
          id: 1,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-01-01"),
          updated_at: new Date("2024-01-01"),
          privacy_policy_version: "invalid"
        },
        {
          id: 2,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: true,
          created_at: new Date("2024-02-01"),
          updated_at: new Date("2024-02-01"),
          privacy_policy_version: "1.0.0"
        },
        {
          id: 3,
          account_id: 1,
          accepted_privacy_policy: true,
          accepted_marketing: false,
          accepted_tournament_newsletter: false,
          created_at: new Date("2024-03-01"),
          updated_at: new Date("2024-03-01"),
          privacy_policy_version: "not-a-version"
        }
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemver(1);

      // Should use 1.0.0 as it's the only valid semver, and it has accepted_tournament_newsletter = true
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
        // Account 1: has 1.0.0 (false) and 2.0.0 (true) - should use 2.0.0
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
        // Account 2: has 1.5.0 (true) and 2.0.0 (false) - should use 2.0.0
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
        // Account 3: has 2.0.1 (true) - should use 2.0.1
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
      expect(result.get(1)).toBe(true); // Latest is 2.0.0 with true
      expect(result.get(2)).toBe(false); // Latest is 2.0.0 with false
      expect(result.get(3)).toBe(true); // Latest is 2.0.1 with true
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
        // Account 2 has no policies
      ];

      mockRunQuery.mockResolvedValue(mockPolicies);

      const result = await getLatestNewsletterConsentBySemverBatch([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(true);
      expect(result.get(2)).toBe(false);
    });

    it("should handle patch version correctly for multiple accounts (e.g., 2.0.1 > 2.0.0)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        // Account 1: 2.0.0 (false) and 2.0.1 (true) - should use 2.0.1
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
        // Account 2: 2.0.1 (false) and 2.0.0 (true) - should use 2.0.1
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
      expect(result.get(1)).toBe(true); // Latest is 2.0.1 with true
      expect(result.get(2)).toBe(false); // Latest is 2.0.1 with false
    });

    it("should filter out invalid semver versions and use valid ones for each account", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        // Account 1: invalid version and valid 1.0.0 (true) - should use 1.0.0
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
        // Account 2: only invalid versions - should return false
        createMockUserPolicyAcceptance({
          id: 3,
          account_id: 2,
          accepted_tournament_newsletter: true,
          privacy_policy_version: "not-a-version"
        }),
        // Account 3: valid 2.0.0 (true) - should use 2.0.0
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
      expect(result.get(1)).toBe(true); // Uses valid 1.0.0 with true
      expect(result.get(2)).toBe(false); // No valid semver versions
      expect(result.get(3)).toBe(true); // Uses 2.0.0 with true
    });

    it("should handle major version correctly for multiple accounts (e.g., 3.0.0 > 2.9.9)", async () => {
      const mockPolicies: UserPolicyAcceptance[] = [
        // Account 1: 2.9.9 (false) and 3.0.0 (true) - should use 3.0.0
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
        // Account 2: 3.0.0 (false) and 2.9.9 (true) - should use 3.0.0
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
      expect(result.get(1)).toBe(true); // Latest is 3.0.0 with true
      expect(result.get(2)).toBe(false); // Latest is 3.0.0 with false
    });
  });
});
