import {
  isValidSteamId,
  validateSteamId,
  normalizeSteamId,
  convertSteamIdToSteamId64,
  convertSteamId3ToSteamId64
} from "./steam-id-validator";
import { BadRequestError } from "./errors";

describe("Steam ID Validator", () => {
  describe("isValidSteamId", () => {
    it("should return true for valid Steam ID 64 format", () => {
      // Valid Steam ID 64 format (17 digits)
      expect(isValidSteamId("76561198012345678")).toBe(true);
    });

    it("should return false for invalid Steam ID formats", () => {
      // Empty string
      expect(isValidSteamId("")).toBe(false);

      // Null/undefined
      expect(isValidSteamId(null as unknown as string)).toBe(false);
      expect(isValidSteamId(undefined as unknown as string)).toBe(false);

      // Wrong length
      expect(isValidSteamId("7656119801234567")).toBe(false); // 16 digits
      expect(isValidSteamId("765611980123456789")).toBe(false); // 18 digits

      // Non-numeric characters
      expect(isValidSteamId("7656119801234567a")).toBe(false);
      expect(isValidSteamId("STEAM_0:1:12345678")).toBe(false);

      // With whitespace
      expect(isValidSteamId(" 76561198012345678")).toBe(false);
      expect(isValidSteamId("76561198012345678 ")).toBe(false);
    });
  });

  describe("validateSteamId", () => {
    it("should return the valid Steam ID", () => {
      const steamId = "76561198012345678";
      expect(validateSteamId(steamId)).toBe(steamId);
    });

    it("should throw BadRequestError for invalid Steam ID", () => {
      expect(() => validateSteamId("invalid")).toThrow(BadRequestError);
      expect(() => validateSteamId("")).toThrow(BadRequestError);
    });

    it("should use custom error message", () => {
      const customMessage = "Custom error message";
      expect(() => validateSteamId("invalid", customMessage)).toThrow(
        customMessage
      );
    });
  });

  describe("normalizeSteamId", () => {
    it("should return the valid Steam ID as is", () => {
      const steamId = "76561198012345678";
      expect(normalizeSteamId(steamId)).toBe(steamId);
    });

    it("should trim whitespace", () => {
      expect(normalizeSteamId(" 76561198012345678 ")).toBe("76561198012345678");
    });

    it("should convert SteamID format to SteamID64", () => {
      // Example: STEAM_0:1:44739960 -> 76561198049745649
      expect(normalizeSteamId("STEAM_0:1:44739960")).toBe("76561198049745649");
      expect(normalizeSteamId("STEAM_1:0:12345678")).toBe("76561197984957084");
      expect(normalizeSteamId("STEAM_0:0:12345678")).toBe("76561197984957084");

      // Additional test case: STEAM_0:0:3809644 -> 76561197967885016
      expect(normalizeSteamId("STEAM_0:0:3809644")).toBe("76561197967885016");
    });

    it("should convert SteamID3 format to SteamID64", () => {
      // Example: [U:1:89479921] -> 76561198049745649
      expect(normalizeSteamId("[U:1:89479921]")).toBe("76561198049745649");
      expect(normalizeSteamId("[U:1:12345678]")).toBe("76561197972611406");

      // Additional test case: [U:1:7619288] -> 76561197967885016
      expect(normalizeSteamId("[U:1:7619288]")).toBe("76561197967885016");
    });

    it("should trim whitespace in SteamID and SteamID3 formats", () => {
      expect(normalizeSteamId(" STEAM_0:1:44739960 ")).toBe(
        "76561198049745649"
      );
      expect(normalizeSteamId(" [U:1:89479921] ")).toBe("76561198049745649");
    });

    it("should throw BadRequestError for invalid Steam ID", () => {
      expect(() => normalizeSteamId("invalid")).toThrow(BadRequestError);
      expect(() => normalizeSteamId("")).toThrow(BadRequestError);
      expect(() => normalizeSteamId("STEAM_2:1:123")).toThrow(BadRequestError); // Invalid SteamID format
      expect(() => normalizeSteamId("[U:2:123]")).toThrow(BadRequestError); // Invalid SteamID3 format
    });
  });

  describe("convertSteamIdToSteamId64", () => {
    it("should convert valid SteamID to SteamID64", () => {
      // Example from user query: STEAM_0:1:44739960 -> 76561198049745649
      expect(convertSteamIdToSteamId64("STEAM_0:1:44739960")).toBe(
        "76561198049745649"
      );
      expect(convertSteamIdToSteamId64("STEAM_1:0:12345678")).toBe(
        "76561197984957084"
      );
      expect(convertSteamIdToSteamId64("STEAM_0:0:12345678")).toBe(
        "76561197984957084"
      );

      // Additional test case: STEAM_0:0:3809644 -> 76561197967885016
      expect(convertSteamIdToSteamId64("STEAM_0:0:3809644")).toBe(
        "76561197967885016"
      );
    });

    it("should trim whitespace", () => {
      expect(convertSteamIdToSteamId64(" STEAM_0:1:44739960 ")).toBe(
        "76561198049745649"
      );
    });

    it("should throw BadRequestError for invalid SteamID format", () => {
      expect(() => convertSteamIdToSteamId64("STEAM_2:1:123")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamIdToSteamId64("STEAM_0:2:123")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamIdToSteamId64("invalid")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamIdToSteamId64("")).toThrow(BadRequestError);
    });
  });

  describe("convertSteamId3ToSteamId64", () => {
    it("should convert valid SteamID3 to SteamID64", () => {
      // Example from user query: [U:1:89479921] -> 76561198049745649
      expect(convertSteamId3ToSteamId64("[U:1:89479921]")).toBe(
        "76561198049745649"
      );
      expect(convertSteamId3ToSteamId64("[U:1:12345678]")).toBe(
        "76561197972611406"
      );

      // Additional test case: [U:1:7619288] -> 76561197967885016
      expect(convertSteamId3ToSteamId64("[U:1:7619288]")).toBe(
        "76561197967885016"
      );
    });

    it("should trim whitespace", () => {
      expect(convertSteamId3ToSteamId64(" [U:1:89479921] ")).toBe(
        "76561198049745649"
      );
    });

    it("should throw BadRequestError for invalid SteamID3 format", () => {
      expect(() => convertSteamId3ToSteamId64("[U:2:123]")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamId3ToSteamId64("[U:1:abc]")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamId3ToSteamId64("invalid")).toThrow(
        BadRequestError
      );
      expect(() => convertSteamId3ToSteamId64("")).toThrow(BadRequestError);
    });
  });

  describe("cross-format conversion consistency", () => {
    it("should convert STEAM_0:1:20796117 and [U:1:41592235] to the same SteamID64", () => {
      const steamId = "STEAM_0:1:20796117";
      const steamId3 = "[U:1:41592235]";
      const expectedSteamId64 = "76561198001857963";

      expect(normalizeSteamId(steamId)).toBe(expectedSteamId64);
      expect(normalizeSteamId(steamId3)).toBe(expectedSteamId64);
      expect(convertSteamIdToSteamId64(steamId)).toBe(expectedSteamId64);
      expect(convertSteamId3ToSteamId64(steamId3)).toBe(expectedSteamId64);
    });
  });
});
