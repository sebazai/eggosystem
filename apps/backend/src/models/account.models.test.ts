import { getLatestNewsletterConsentBySemver } from "./account.models";
import { runQuery } from "../db/mysqlRunQuery";
import type { UserPolicyAcceptance } from "@eggosystem/types";

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
});
