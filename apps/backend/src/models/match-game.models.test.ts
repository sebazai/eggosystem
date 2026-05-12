import { validWebhookMatchDemoReady } from "../utils/test-data";
import { validMatchDetailsMatchDemoReady } from "@eggosystem/shared-msw";

// Mock dependencies for addMatchGamesForMatch tests only
jest.mock("../models/match.models");
jest.mock("../models/match-team-map-veto.models");
jest.mock("../models/match-game.models", () => {
  const actual = jest.requireActual("../models/match-game.models");
  return {
    ...actual,
    getMatchGameByDemoUrl: jest.fn()
  };
});
jest.mock("../db/mysqlConnection");
jest.mock("../db/mysqlRunQuery");
jest.mock("../services/faceit.services", () => {
  const actual = jest.requireActual("../services/faceit.services");
  return {
    ...actual,
    getDemoDownloadUrl: jest.fn()
  };
});
import { getHubMatchesByExternalMatchRoomId } from "./match.models";
import { getMatchPickedMapsOrderedByVetoOrder } from "./match-team-map-veto.models";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import { getDemoDownloadUrl } from "../services/faceit.services";
import { addFaceitMatchGameToDatabase } from "../services/faceit.services";
import { getMatchGameByDemoUrl } from "./match-game.models";

const mockGetHubMatchesByExternalMatchRoomId =
  getHubMatchesByExternalMatchRoomId as jest.MockedFunction<
    typeof getHubMatchesByExternalMatchRoomId
  >;

const mockGetMatchTeamMapVetoPicksAndDeciders =
  getMatchPickedMapsOrderedByVetoOrder as jest.MockedFunction<
    typeof getMatchPickedMapsOrderedByVetoOrder
  >;

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockGetDemoDownloadUrl = getDemoDownloadUrl as jest.MockedFunction<
  typeof getDemoDownloadUrl
>;
const mockGetMatchGameByDemoUrl = getMatchGameByDemoUrl as jest.MockedFunction<
  typeof getMatchGameByDemoUrl
>;

describe("addMatchGamesForMatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success Cases", () => {
    beforeEach(() => {
      // Mock getMatchGameByDemoUrl to return undefined so short circuit doesn't fire
      mockGetMatchGameByDemoUrl.mockResolvedValue(undefined);

      // Mock successful database operations
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
        { id: 1, status: "ONGOING" },
        { id: 2, status: "ONGOING" }
      ]);

      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };
      mockGetConnection.mockResolvedValue(
        mockConnection as unknown as ReturnType<typeof getConnection>
      );

      mockGetMatchTeamMapVetoPicksAndDeciders.mockResolvedValue([
        {
          id: 1,
          match_id: 1,
          team_id: 1,
          map_id: 1,
          veto_order: 1,
          action: "pick"
        },
        {
          id: 2,
          match_id: 1,
          team_id: 1,
          map_id: 2,
          veto_order: 2,
          action: "pick"
        },
        {
          id: 3,
          match_id: 1,
          team_id: 1,
          map_id: 3,
          veto_order: 3,
          action: "decider"
        }
        // 2 picks + 1 decider for BO3
      ]);

      // Mock the addMatchGameForMatch function (which calls runQuery)
      mockRunQuery.mockResolvedValue([{ insertId: 123 }]);

      // Mock getDemoDownloadUrl to return a valid download URL
      mockGetDemoDownloadUrl.mockResolvedValue(
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
      );
    });

    it("should successfully add match games for BO3 championship match", async () => {
      await addFaceitMatchGameToDatabase(
        validWebhookMatchDemoReady,
        validMatchDetailsMatchDemoReady
      );

      // Verify matches were fetched
      expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
        "1-ffb4225f-ff51-42ed-acb5-af6714175934"
      );

      // Verify database transaction was started and committed
      expect(mockGetConnection).toHaveBeenCalled();
      expect(mockGetMatchTeamMapVetoPicksAndDeciders).toHaveBeenCalledWith(
        1,
        expect.any(Object)
      );
    });

    it("should handle BO2 played as 2xBO1 matches", async () => {
      // Create BO2 webhook with demo URL for map 1
      const bo2Webhook = {
        ...validWebhookMatchDemoReady,
        payload: {
          ...validWebhookMatchDemoReady.payload,
          demo_url:
            "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
        }
      };

      // Mock BO2 match details
      const bo2MatchDetails = {
        ...validMatchDetailsMatchDemoReady,
        best_of: 2
      };

      // Mock only 2 map vetoes for BO2
      mockGetMatchTeamMapVetoPicksAndDeciders.mockResolvedValue([
        {
          id: 1,
          match_id: 1,
          team_id: 1,
          map_id: 1,
          veto_order: 1,
          action: "pick"
        },
        {
          id: 2,
          match_id: 1,
          team_id: 1,
          map_id: 2,
          veto_order: 2,
          action: "pick"
        }
      ]);

      await addFaceitMatchGameToDatabase(bo2Webhook, bo2MatchDetails, true);

      // Verify BO2 specific logic was used
      expect(mockGetMatchTeamMapVetoPicksAndDeciders).toHaveBeenCalledWith(
        1,
        expect.any(Object)
      );
    });
  });

  describe("Error Cases", () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock getMatchGameByDemoUrl to return undefined so short circuit doesn't fire
      mockGetMatchGameByDemoUrl.mockResolvedValue(undefined);

      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };
      mockGetConnection.mockResolvedValue(
        mockConnection as unknown as ReturnType<typeof getConnection>
      );

      // Mock getDemoDownloadUrl to return a valid download URL
      mockGetDemoDownloadUrl.mockResolvedValue(
        "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
      );
    });

    it("should throw error when no matches found", async () => {
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([]);

      await expect(
        addFaceitMatchGameToDatabase(
          validWebhookMatchDemoReady,
          validMatchDetailsMatchDemoReady,
          false
        )
      ).rejects.toThrow(
        "No matches found when adding match games with match_id: 1-ffb4225f-ff51-42ed-acb5-af6714175934"
      );
    });

    it("should throw error for invalid BO2 configuration", async () => {
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
        { id: 1, status: "ONGOING" },
        { id: 2, status: "ONGOING" }
      ]);

      const bo2MatchDetails = {
        ...validMatchDetailsMatchDemoReady,
        best_of: 2
      };

      // Mock wrong number of map vetoes for BO2
      mockGetMatchTeamMapVetoPicksAndDeciders.mockResolvedValue([
        {
          id: 1,
          match_id: 1,
          team_id: 1,
          map_id: 1,
          veto_order: 1,
          action: "pick"
        }
        // Only 1 veto instead of 2 for BO2
      ]);

      // Create webhook with demo URL for map 1
      const bo2Webhook = {
        ...validWebhookMatchDemoReady,
        payload: {
          ...validWebhookMatchDemoReady.payload,
          demo_url:
            "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
        }
      };

      await expect(
        addFaceitMatchGameToDatabase(bo2Webhook, bo2MatchDetails, true)
      ).rejects.toThrow("Something is very wrong with this 2xBO1");
    });

    it("should throw error when match object not found for BO2", async () => {
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
        { id: 1, status: "ONGOING" },
        { id: 2, status: "ONGOING" }
        // 2 matches for BO2, but map 2 won't find a match object
      ]);

      // Create webhook with demo URL for map 3 (which is out of range for BO2 with 2 matches)
      const bo2Webhook = {
        ...validWebhookMatchDemoReady,
        payload: {
          ...validWebhookMatchDemoReady.payload,
          demo_url:
            "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-3-1.dem.zst"
        }
      };

      const bo2MatchDetails = {
        ...validMatchDetailsMatchDemoReady,
        best_of: 2
      };

      mockGetMatchTeamMapVetoPicksAndDeciders.mockResolvedValue([
        {
          id: 1,
          match_id: 1,
          team_id: 1,
          map_id: 1,
          veto_order: 1,
          action: "pick"
        },
        {
          id: 2,
          match_id: 1,
          team_id: 1,
          map_id: 2,
          veto_order: 2,
          action: "pick"
        }
      ]);

      await expect(
        addFaceitMatchGameToDatabase(bo2Webhook, bo2MatchDetails, true)
      ).rejects.toThrow("Could not find match object for 2xBO1 matches");
    });

    it("should handle database errors and rollback transaction", async () => {
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
        { id: 1, status: "ONGOING" }
      ]);

      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockRejectedValue(new Error("Database error")),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };
      mockGetConnection.mockResolvedValue(
        mockConnection as unknown as ReturnType<typeof getConnection>
      );

      mockGetMatchTeamMapVetoPicksAndDeciders.mockResolvedValue([
        {
          id: 1,
          match_id: 1,
          team_id: 1,
          map_id: 1,
          veto_order: 1,
          action: "pick"
        },
        {
          id: 2,
          match_id: 1,
          team_id: 1,
          map_id: 2,
          veto_order: 2,
          action: "pick"
        },
        {
          id: 3,
          match_id: 1,
          team_id: 1,
          map_id: 3,
          veto_order: 3,
          action: "decider"
        }
        // 2 picks + 1 decider for BO3
      ]);

      // Create webhook with demo URL for map 1
      const bo3Webhook = {
        ...validWebhookMatchDemoReady,
        payload: {
          ...validWebhookMatchDemoReady.payload,
          demo_url:
            "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
        }
      };

      await expect(
        addFaceitMatchGameToDatabase(
          bo3Webhook,
          validMatchDetailsMatchDemoReady,
          false
        )
      ).rejects.toThrow("Database error");

      // Verify rollback was called
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
