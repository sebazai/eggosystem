import { parseFaceitDemoUrl } from "./faceit-demo-url-parser";

describe("parseDemoUrl", () => {
  describe("valid demo URLs", () => {
    it("should parse US East demo URL with zst compression", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.zst";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8",
        compression: "zst"
      });
    });

    it("should parse Europe Central demo URL with gz compression", () => {
      const url =
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1-1-2.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 2,
        matchId: "1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1",
        compression: "gz"
      });
    });

    it("should parse demo URL with map 3, sequence 3", () => {
      const url =
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1-3-3.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 3,
        sequenceNumber: 3,
        matchId: "1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1",
        compression: "gz"
      });
    });

    it("should parse demo URL with map 2, sequence 10", () => {
      const url =
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1-2-10.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 2,
        sequenceNumber: 10,
        matchId: "1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1",
        compression: "gz"
      });
    });

    it("should parse demo URL with double-digit map and sequence numbers", () => {
      const url =
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1-15-25.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 15,
        sequenceNumber: 25,
        matchId: "1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1",
        compression: "gz"
      });
    });

    it("should parse demo URL with different UUID format", () => {
      const url =
        "https://demos-us-west.backblaze.faceit-cdn.net/cs2/2-0b7aa864-afd1-457b-989d-7daae7b407ee-1-1.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "2-0b7aa864-afd1-457b-989d-7daae7b407ee",
        compression: "gz"
      });
    });
  });

  describe("invalid demo URLs", () => {
    it("should return null for non-URL strings", () => {
      const result = parseFaceitDemoUrl("not-a-url");
      expect(result).toBeNull();
    });

    it("should return null for URLs without demo extension", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.txt";
      const result = parseFaceitDemoUrl(url);
      expect(result).toBeNull();
    });

    it("should return null for URLs with wrong format (missing numbers)", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8.dem.gz";
      const result = parseFaceitDemoUrl(url);
      expect(result).toBeNull();
    });

    it("should return null for URLs with wrong format (only one number)", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1.dem.gz";
      const result = parseFaceitDemoUrl(url);
      expect(result).toBeNull();
    });

    it("should return null for URLs with non-numeric values", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-abc-def.dem.gz";
      const result = parseFaceitDemoUrl(url);
      expect(result).toBeNull();
    });

    it("should return null for URLs with invalid compression format", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.zip";
      const result = parseFaceitDemoUrl(url);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = parseFaceitDemoUrl("");
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = parseFaceitDemoUrl(null as unknown as string);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = parseFaceitDemoUrl(undefined as unknown as string);
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle URLs with query parameters", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.zst?param=value";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8",
        compression: "zst"
      });
    });

    it("should handle URLs with fragments", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.zst#fragment";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8",
        compression: "zst"
      });
    });

    it("should handle URLs with different subdomains", () => {
      const url =
        "https://demos-asia-southeast.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8",
        compression: "gz"
      });
    });

    it("should handle URLs with different games", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/csgo/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8",
        compression: "gz"
      });
    });
  });

  describe("UUID v4 format handling", () => {
    it("should correctly parse UUID v4 with hyphens", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/550e8400-e29b-41d4-a716-446655440000-1-1.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "550e8400-e29b-41d4-a716-446655440000",
        compression: "gz"
      });
    });

    it("should handle UUID with leading numbers", () => {
      const url =
        "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-550e8400-e29b-41d4-a716-446655440000-1-1.dem.gz";
      const result = parseFaceitDemoUrl(url);

      expect(result).toEqual({
        mapNumber: 1,
        sequenceNumber: 1,
        matchId: "1-550e8400-e29b-41d4-a716-446655440000",
        compression: "gz"
      });
    });
  });
});
