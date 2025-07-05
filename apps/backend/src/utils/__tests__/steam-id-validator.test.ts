import {
  isValidSteamId,
  validateSteamId,
  normalizeSteamId
} from "../steam-id-validator";
import { BadRequestError } from "../errors";

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

    it("should throw BadRequestError for invalid Steam ID", () => {
      expect(() => normalizeSteamId("invalid")).toThrow(BadRequestError);
      expect(() => normalizeSteamId("")).toThrow(BadRequestError);
    });
  });
});
