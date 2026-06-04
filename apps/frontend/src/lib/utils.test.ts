import {
  resolveSteamIdToSteamId64,
  isValidSteamId,
  createTeamLogoUrl,
  createAvatarUrl,
  createOrgLogoUrl,
  LOCAL_NO_LOGO_PATH,
  isLocalNoLogoPath,
  resolveAbsoluteImageUrl
} from "./utils";

describe("Steam ID Utils", () => {
  describe("resolveSteamIdToSteamId64", () => {
    describe("SteamID64 format", () => {
      it("should return SteamID64 as-is when already valid", async () => {
        const steamId64 = "76561198049745649";
        const result = await resolveSteamIdToSteamId64(steamId64);
        expect(result).toBe(steamId64);
      });

      it("should handle SteamID64 with whitespace", async () => {
        const steamId64 = "76561198049745649";
        const result = await resolveSteamIdToSteamId64(`  ${steamId64} `);
        expect(result).toBe(steamId64);
      });
    });

    describe("SteamID format (STEAM_X:Y:Z)", () => {
      it("should convert STEAM_0:1:44739960 to SteamID64", async () => {
        const result = await resolveSteamIdToSteamId64("STEAM_0:1:44739960");
        expect(result).toBe("76561198049745649");
        expect(isValidSteamId(result!)).toBe(true);
      });

      it("should handle whitespace in SteamID format", async () => {
        const result = await resolveSteamIdToSteamId64(" STEAM_0:1:44739960 ");
        expect(result).toBe("76561198049745649");
      });

      it("should return null for invalid SteamID format", async () => {
        const result = await resolveSteamIdToSteamId64("STEAM_2:1:123");
        expect(result).toBeNull();
      });
    });

    describe("SteamID3 format ([U:1:AccountID])", () => {
      it("should convert [U:1:89479921] to SteamID64", async () => {
        const result = await resolveSteamIdToSteamId64("[U:1:89479921]");
        expect(result).toBe("76561198049745649");
        expect(isValidSteamId(result!)).toBe(true);
      });

      it("should handle whitespace in SteamID3 format", async () => {
        const result = await resolveSteamIdToSteamId64(" [U:1:89479921] ");
        expect(result).toBe("76561198049745649");
      });

      it("should return null for invalid SteamID3 format", async () => {
        const result = await resolveSteamIdToSteamId64("[U:2:123]");
        expect(result).toBeNull();
      });
    });

    describe("Steam profile URLs (/profiles/)", () => {
      it("should extract SteamID64 from https://steamcommunity.com/profiles/ URL", async () => {
        const result = await resolveSteamIdToSteamId64(
          "https://steamcommunity.com/profiles/76561198049745649"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from http://steamcommunity.com/profiles/ URL", async () => {
        const result = await resolveSteamIdToSteamId64(
          "http://steamcommunity.com/profiles/76561198049745649"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from URL with trailing slash", async () => {
        const result = await resolveSteamIdToSteamId64(
          "https://steamcommunity.com/profiles/76561198049745649/"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from URL with query parameters", async () => {
        const result = await resolveSteamIdToSteamId64(
          "https://steamcommunity.com/profiles/76561198049745649?param=value"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from /profiles/ path without domain", async () => {
        const result = await resolveSteamIdToSteamId64(
          "/profiles/76561198049745649"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from steamcommunity.com URL without protocol", async () => {
        const result = await resolveSteamIdToSteamId64(
          "steamcommunity.com/profiles/76561198049745649"
        );
        expect(result).toBe("76561198049745649");
      });

      it("should extract SteamID64 from www.steamcommunity.com URL", async () => {
        const result = await resolveSteamIdToSteamId64(
          "https://www.steamcommunity.com/profiles/76561198049745649"
        );
        expect(result).toBe("76561198049745649");
      });
    });

    describe("Custom vanity URLs", () => {
      it("should return null for vanity URL (requires API call)", async () => {
        const result = await resolveSteamIdToSteamId64(
          "https://steamcommunity.com/id/sububobi"
        );
        expect(result).toBeNull();
      });

      it("should return null for vanity URL without protocol", async () => {
        const result = await resolveSteamIdToSteamId64(
          "steamcommunity.com/id/sububobi"
        );
        expect(result).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("should return null for empty string", async () => {
        const result = await resolveSteamIdToSteamId64("");
        expect(result).toBeNull();
      });

      it("should return null for whitespace-only string", async () => {
        const result = await resolveSteamIdToSteamId64("   ");
        expect(result).toBeNull();
      });

      it("should return null for invalid input", async () => {
        const result = await resolveSteamIdToSteamId64("invalid-input");
        expect(result).toBeNull();
      });

      it("should return null for invalid SteamID64 length", async () => {
        const result = await resolveSteamIdToSteamId64("1234567890123456"); // 16 digits
        expect(result).toBeNull();
      });
    });

    describe("Cross-format consistency", () => {
      it("should convert STEAM_0:1:44739960 and [U:1:89479921] to the same SteamID64", async () => {
        const steamIdResult =
          await resolveSteamIdToSteamId64("STEAM_0:1:44739960");
        const steamId3Result =
          await resolveSteamIdToSteamId64("[U:1:89479921]");
        const expectedSteamId64 = "76561198049745649";

        expect(steamIdResult).toBe(expectedSteamId64);
        expect(steamId3Result).toBe(expectedSteamId64);
      });

      it("should convert STEAM_0:1:20796117 and [U:1:41592235] to the same SteamID64", async () => {
        const steamIdResult =
          await resolveSteamIdToSteamId64("STEAM_0:1:20796117");
        const steamId3Result =
          await resolveSteamIdToSteamId64("[U:1:41592235]");
        const expectedSteamId64 = "76561198001857963";

        expect(steamIdResult).toBe(expectedSteamId64);
        expect(steamId3Result).toBe(expectedSteamId64);
      });
    });
  });
});

describe("image URL helpers", () => {
  it("createTeamLogoUrl uses local placeholder for nologo.png", () => {
    expect(createTeamLogoUrl("nologo.png")).toBe(LOCAL_NO_LOGO_PATH);
  });

  it("createOrgLogoUrl uses local placeholder for nologo.png", () => {
    expect(createOrgLogoUrl("nologo.png")).toBe(LOCAL_NO_LOGO_PATH);
  });

  it("createAvatarUrl skips image service for nologo.png", () => {
    expect(createAvatarUrl("nologo.png")).toBe("");
  });

  it("createTeamLogoUrl still resolves phash identifiers", () => {
    expect(createTeamLogoUrl("8f85f92562586f19")).toBe(
      "https://img.kanaliiga.fi/images/by-hash/phash/8f85f92562586f19"
    );
  });

  it("isLocalNoLogoPath detects placeholder paths", () => {
    expect(isLocalNoLogoPath(LOCAL_NO_LOGO_PATH)).toBe(true);
    expect(
      isLocalNoLogoPath("https://img.kanaliiga.fi/images/by-hash/phash/abc")
    ).toBe(false);
  });

  it("resolveAbsoluteImageUrl keeps absolute URLs unchanged", () => {
    const remoteUrl = "https://img.kanaliiga.fi/images/by-hash/phash/abc";
    expect(resolveAbsoluteImageUrl(remoteUrl)).toBe(remoteUrl);
  });

  it("resolveAbsoluteImageUrl converts app-relative paths", () => {
    expect(resolveAbsoluteImageUrl(LOCAL_NO_LOGO_PATH)).toBe(
      "http://localhost:3000/team-images/nologo.png"
    );
  });
});
