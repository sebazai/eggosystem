import {
  getFaceITGameRank,
  getFaceITCS2Rank,
  getAllFaceITChampionshipSubscriptions
} from "./faceit.services";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitCs2EmptyMetadataSteamId
} from "@eggosystem/shared-msw";

describe("FaceIT Services", () => {
  describe("getFaceITGameRank", () => {
    it("should return rank data for valid Steam ID", async () => {
      const result = await getFaceITGameRank(faceitValidSteamId, "cs2");

      expect(result).toEqual({
        elo: 1500,
        rank: 7,
        player_id: faceitValidSteamId
      });
    });

    it("should return null for 404 response", async () => {
      const result = await getFaceITGameRank(faceitNotFoundSteamId, "cs2");

      expect(result).toBeNull();
    });

    it("should handle network errors", async () => {
      try {
        await getFaceITGameRank(faceitNetworkErrorSteamId, "cs2");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as unknown as Error).message).toContain(
          "Failed to fetch"
        );
      }
    });

    it("should handle invalid JSON response", async () => {
      try {
        await getFaceITGameRank(faceitInvalidJsonSteamId, "cs2");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as unknown as Error).message).toContain("Invalid JSON");
      }
    });

    it("should handle malformed response data", async () => {
      try {
        await getFaceITGameRank(faceitInvalidGameDataSteamId, "cs2");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
        expect((error as unknown as Error).message).toBe("Invalid rank data");
      }
    });
  });

  describe("getFaceITCS2Rank", () => {
    it("should return FaceIT-specific rank data when successful and not decayed", async () => {
      const result = await getFaceITCS2Rank(faceitValidSteamId);

      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 1500,
          faceit_level: 7,
          faceit_date: expect.any(Number),
          faceit_kd: 1.2,
          metadata: expect.objectContaining({
            faceit_decay: false,
            faceit_last_match: expect.any(Number),
            faceit_matches_played: 100
          })
        })
      );
    });

    it("should return faceit decayed cs2 rank", async () => {
      const result = await getFaceITCS2Rank(faceitValidSteamIdDecayed);

      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 1425,
          faceit_level: 7,
          metadata: expect.objectContaining({
            faceit_decay: true,
            faceit_last_match: expect.any(Number),
            faceit_matches_played: 453
          })
        })
      );
    });

    it("should handle 404 Not Found Error in CS2 rank fetch and return fallback rank", async () => {
      const result = await getFaceITCS2Rank(faceitNotFoundSteamId);

      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 750,
          faceit_level: 2,
          faceit_kd: 0.95,
          faceit_date: expect.any(Number),
          metadata: expect.objectContaining({
            faceit_decay: false,
            faceit_last_match: undefined,
            faceit_matches_played: undefined,
            faceit_fallback: true
          })
        })
      );
    });

    it("should handle missing game data", async () => {
      const result = await getFaceITCS2Rank(faceitInvalidGameDataSteamId);

      // When no game data is found, returns default values with -1
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: -1,
          faceit_level: -1,
          faceit_kd: -1,
          faceit_date: expect.any(Number)
        })
      );
    });

    it("should handle extraordinary case: CS2 rank returns data but metadata has empty items array, falling back to CSGO metadata with past date", async () => {
      const result = await getFaceITCS2Rank(faceitCs2EmptyMetadataSteamId);

      // The CS2 rank should be returned with CSGO metadata (fallback)
      // Since the CSGO metadata has a date 3 years in the past, decay should be applied
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 1440, // Original CS2 elo (1800) with 20% decay (3 years = 36 months)
          faceit_level: 7, // Level 7 corresponds to elo 1440 (1351-1530 range)
          faceit_date: expect.any(Number),
          faceit_kd: 1.8, // From CSGO metadata
          metadata: expect.objectContaining({
            faceit_decay: true, // Decay applied since it's 3 years in the past
            faceit_last_match: expect.any(Number), // Past date from CSGO metadata
            faceit_matches_played: 200 // From CSGO metadata
          })
        })
      );

      // Verify the last match date is in the past (3 years ago)
      const threeYearsAgo = new Date(
        new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000
      ).getTime();

      expect(result.metadata.faceit_last_match).toBeLessThan(
        new Date().getTime()
      );
      expect(result.metadata.faceit_last_match).toBeCloseTo(
        threeYearsAgo,
        -1000
      ); // Within 1 second tolerance
    });
  });

  describe("getAllFaceITChampionshipSubscriptions", () => {
    beforeEach(() => {
      // Mock the fetch function globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return all subscriptions when they fit in a single page", async () => {
      const mockSubscriptions = {
        items: [
          {
            leader: "player1_id",
            coleader: "player2_id",
            team: {
              team_id: "team1",
              name: "Team Alpha",
              team_type: "premade",
              members: [],
              leader: "player1_id",
              chat_room_id: "chat1",
              faceit_url: "https://faceit.com/team1"
            },
            group: 1,
            substitutes: [],
            roster: ["player1_id", "player2_id"],
            status: "registered"
          },
          {
            leader: "player3_id",
            coleader: "player4_id",
            team: {
              team_id: "team2",
              name: "Team Beta",
              team_type: "premade",
              members: [],
              leader: "player3_id",
              chat_room_id: "chat2",
              faceit_url: "https://faceit.com/team2"
            },
            group: 1,
            substitutes: [],
            roster: ["player3_id", "player4_id"],
            status: "registered"
          }
        ],
        start: 0,
        end: 2
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscriptions
      });

      const result =
        await getAllFaceITChampionshipSubscriptions("test-championship");

      expect(result).toEqual(mockSubscriptions);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=0&limit=10",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
          })
        })
      );
    });

    it("should combine multiple pages of subscriptions", async () => {
      const firstPageMock = {
        items: Array(10)
          .fill(null)
          .map((_, i) => ({
            leader: `player${i}_id`,
            coleader: `player${i + 1}_id`,
            team: {
              team_id: `team${i}`,
              name: `Team ${i}`,
              team_type: "premade",
              members: [],
              leader: `player${i}_id`,
              chat_room_id: `chat${i}`,
              faceit_url: `https://faceit.com/team${i}`
            },
            group: 1,
            substitutes: [],
            roster: [`player${i}_id`, `player${i + 1}_id`],
            status: "registered"
          })),
        start: 0,
        end: 10,
        other_field: "test_data"
      };

      const secondPageMock = {
        items: Array(5)
          .fill(null)
          .map((_, i) => ({
            leader: `player${i + 10}_id`,
            coleader: `player${i + 11}_id`,
            team: {
              team_id: `team${i + 10}`,
              name: `Team ${i + 10}`,
              team_type: "premade",
              members: [],
              leader: `player${i + 10}_id`,
              chat_room_id: `chat${i + 10}`,
              faceit_url: `https://faceit.com/team${i + 10}`
            },
            group: 1,
            substitutes: [],
            roster: [`player${i + 10}_id`, `player${i + 11}_id`],
            status: "registered"
          })),
        start: 10,
        end: 15
      };

      // Mock first page call (returns full 10 items)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstPageMock
        })
        // Mock second page call (returns 5 items, less than limit)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondPageMock
        });

      const result =
        await getAllFaceITChampionshipSubscriptions("test-championship");

      expect(result).toEqual({
        ...firstPageMock,
        items: [...firstPageMock.items, ...secondPageMock.items],
        start: 0,
        end: 15
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=0&limit=10",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
          })
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=10&limit=10",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
          })
        })
      );
    });

    it("should handle empty subscriptions", async () => {
      const emptyMock = {
        items: [],
        start: 0,
        end: 0
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyMock
      });

      const result =
        await getAllFaceITChampionshipSubscriptions("empty-championship");

      expect(result).toEqual(emptyMock);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should preserve other fields from the first response", async () => {
      const firstPageMock = {
        items: Array(10)
          .fill(null)
          .map((_, i) => ({
            leader: `player${i}_id`,
            coleader: `player${i + 1}_id`,
            team: {
              team_id: `team${i}`,
              name: `Team ${i}`,
              team_type: "premade",
              members: [],
              leader: `player${i}_id`,
              chat_room_id: `chat${i}`,
              faceit_url: `https://faceit.com/team${i}`
            },
            group: 1,
            substitutes: [],
            roster: [`player${i}_id`, `player${i + 1}_id`],
            status: "registered"
          })),
        start: 0,
        end: 10,
        championship_name: "Test Championship",
        tournament_format: "single_elimination"
      };

      const secondPageMock = {
        items: [
          {
            leader: "player10_id",
            coleader: "player11_id",
            team: {
              team_id: "team10",
              name: "Team 10",
              team_type: "premade",
              members: [],
              leader: "player10_id",
              chat_room_id: "chat10",
              faceit_url: "https://faceit.com/team10"
            },
            group: 1,
            substitutes: [],
            roster: ["player10_id", "player11_id"],
            status: "registered"
          }
        ],
        start: 10,
        end: 11
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstPageMock
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondPageMock
        });

      const result =
        await getAllFaceITChampionshipSubscriptions("test-championship");

      expect(result).toEqual({
        ...firstPageMock,
        items: [...firstPageMock.items, ...secondPageMock.items],
        start: 0,
        end: 11
      });

      // Verify that championship_name and tournament_format are preserved
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).championship_name).toBe("Test Championship");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).tournament_format).toBe("single_elimination");
    });
  });
});
