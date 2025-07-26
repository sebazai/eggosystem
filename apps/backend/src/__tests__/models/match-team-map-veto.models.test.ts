import { addMatchTeamMapVeto } from "../../models/match-team-map-veto.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getHubMatchesByExternalMatchRoomId } from "../../models/match.models";
import { mswServer } from "@eggosystem/shared-msw";
import { http, HttpResponse } from "@eggosystem/shared-msw";

// Mock the database query function
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

// Mock the match models function
jest.mock("../../models/match.models", () => ({
  getHubMatchesByExternalMatchRoomId: jest.fn()
}));

describe("addMatchTeamMapVeto", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
  const mockGetHubMatches =
    getHubMatchesByExternalMatchRoomId as jest.MockedFunction<
      typeof getHubMatchesByExternalMatchRoomId
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch match history and insert vetoes correctly", async () => {
    // Mock the internal match data
    const mockInternalMatch = [
      {
        id: 123,
        external_match_room_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef"
      }
    ];
    mockGetHubMatches.mockResolvedValue(mockInternalMatch);

    // Mock map ID lookups
    mockRunQuery
      .mockResolvedValueOnce([{ id: 1 }]) // de_mirage
      .mockResolvedValueOnce([{ id: 9 }]) // de_anubis
      .mockResolvedValueOnce([{ id: 3 }]) // de_dust2
      .mockResolvedValueOnce([{ id: 8 }]) // de_ancient
      .mockResolvedValueOnce([{ id: 2 }]) // de_inferno
      .mockResolvedValueOnce([{ id: 11 }]) // de_vertigo
      .mockResolvedValueOnce([{ id: 5 }]) // de_nuke
      .mockResolvedValue({ insertId: 1 }); // For INSERT statements

    // Mock the FACEIT API response
    const mockFaceitResponse = {
      payload: {
        match_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
        tickets: [
          {
            entities: [
              {
                guid: "Germany",
                status: "drop",
                random: false,
                round: 1,
                selected_by: "faction1"
              },
              {
                guid: "Netherlands",
                status: "drop",
                random: false,
                round: 2,
                selected_by: "faction2"
              }
            ],
            entity_type: "location",
            vote_type: "drop_pick"
          },
          {
            entities: [
              {
                guid: "de_mirage",
                status: "drop",
                random: false,
                round: 1,
                selected_by: "faction2"
              },
              {
                guid: "de_anubis",
                status: "drop",
                random: false,
                round: 2,
                selected_by: "faction1"
              },
              {
                guid: "de_dust2",
                status: "drop",
                random: false,
                round: 3,
                selected_by: "faction2"
              },
              {
                guid: "de_ancient",
                status: "drop",
                random: false,
                round: 4,
                selected_by: "faction1"
              },
              {
                guid: "de_inferno",
                status: "pick",
                random: false,
                round: 5,
                selected_by: "faction2"
              },
              {
                guid: "de_vertigo",
                status: "pick",
                random: false,
                round: 6,
                selected_by: "faction1"
              },
              {
                guid: "de_nuke",
                status: "drop",
                random: false,
                round: 7,
                selected_by: "faction1"
              }
            ],
            entity_type: "map",
            vote_type: "drop_pick"
          }
        ]
      }
    };

    // Set up MSW handler for the FACEIT API
    mswServer.use(
      http.get(
        "https://www.faceit.com/api/democracy/v1/match/1-ff5e99c3-0765-4173-ba2a-398987b1b3ef/history",
        () => {
          return HttpResponse.json(mockFaceitResponse);
        }
      )
    );

    const externalMatchId = "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef";
    const faction1TeamId = 1001;
    const faction2TeamId = 1002;

    await addMatchTeamMapVeto(externalMatchId, faction1TeamId, faction2TeamId);

    // Verify getHubMatchesByExternalMatchRoomId was called
    expect(mockGetHubMatches).toHaveBeenCalledWith(externalMatchId);

    // Verify map ID lookups (7 map lookups + 7 INSERT statements = 14 total calls)
    expect(mockRunQuery).toHaveBeenCalledTimes(14);

    // Check map ID lookups
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      1,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_mirage"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      2,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_anubis"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      3,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_dust2"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      4,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_ancient"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      5,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_inferno"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      6,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_vertigo"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      7,
      "SELECT id FROM Maps WHERE name = ?",
      ["de_nuke"]
    );

    // Check INSERT statements (using internal match ID 123)
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      8,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction2TeamId, 1, "drop", 1],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      9,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction1TeamId, 9, "drop", 2],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      10,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction2TeamId, 3, "drop", 3],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      11,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction1TeamId, 8, "drop", 4],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      12,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction2TeamId, 2, "pick", 5],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      13,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction1TeamId, 11, "pick", 6],
      undefined
    );

    expect(mockRunQuery).toHaveBeenNthCalledWith(
      14,
      "INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)",
      [123, faction1TeamId, 5, "drop", 7],
      undefined
    );
  });

  it("should throw error when no internal match is found", async () => {
    // Mock no internal match found
    mockGetHubMatches.mockResolvedValue(null);

    await expect(
      addMatchTeamMapVeto("1-ff5e99c3-0765-4173-ba2a-398987b1b3ef", 1001, 1002)
    ).rejects.toThrow(
      "No match map vetoes found for external_match_id: 1-ff5e99c3-0765-4173-ba2a-398987b1b3ef"
    );
  });

  it("should throw error when FACEIT API returns non-200 status", async () => {
    // Mock internal match data
    const mockInternalMatch = [
      { id: 123, external_match_room_id: "invalid-match-id" }
    ];
    mockGetHubMatches.mockResolvedValue(mockInternalMatch);

    // Set up MSW handler for error response
    mswServer.use(
      http.get(
        "https://www.faceit.com/api/democracy/v1/match/invalid-match-id/history",
        () => {
          return HttpResponse.json({ error: "Not Found" }, { status: 404 });
        }
      )
    );

    await expect(
      addMatchTeamMapVeto("invalid-match-id", 1001, 1002)
    ).rejects.toThrow(
      "Failed to fetch match history for match invalid-match-id: 404 Not Found"
    );
  });

  it("should throw error when no map veto data is found", async () => {
    // Mock internal match data
    const mockInternalMatch = [
      {
        id: 123,
        external_match_room_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef"
      }
    ];
    mockGetHubMatches.mockResolvedValue(mockInternalMatch);

    const mockFaceitResponse = {
      payload: {
        match_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
        tickets: [
          {
            entities: [
              {
                guid: "Germany",
                status: "drop",
                random: false,
                round: 1,
                selected_by: "faction1"
              }
            ],
            entity_type: "location",
            vote_type: "drop_pick"
          }
        ]
      }
    };

    // Set up MSW handler for response without map veto data
    mswServer.use(
      http.get(
        "https://www.faceit.com/api/democracy/v1/match/1-ff5e99c3-0765-4173-ba2a-398987b1b3ef/history",
        () => {
          return HttpResponse.json(mockFaceitResponse);
        }
      )
    );

    await expect(
      addMatchTeamMapVeto("1-ff5e99c3-0765-4173-ba2a-398987b1b3ef", 1001, 1002)
    ).rejects.toThrow(
      "No map veto data found for match 1-ff5e99c3-0765-4173-ba2a-398987b1b3ef"
    );
  });

  it("should throw error for unknown map GUID", async () => {
    // Mock internal match data
    const mockInternalMatch = [
      {
        id: 123,
        external_match_room_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef"
      }
    ];
    mockGetHubMatches.mockResolvedValue(mockInternalMatch);

    // Mock map lookup to return empty result
    mockRunQuery.mockResolvedValue([]);

    const mockFaceitResponse = {
      payload: {
        match_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
        tickets: [
          {
            entities: [
              {
                guid: "unknown_map",
                status: "drop",
                random: false,
                round: 1,
                selected_by: "faction1"
              }
            ],
            entity_type: "map",
            vote_type: "drop_pick"
          }
        ]
      }
    };

    // Set up MSW handler for response with unknown map
    mswServer.use(
      http.get(
        "https://www.faceit.com/api/democracy/v1/match/1-ff5e99c3-0765-4173-ba2a-398987b1b3ef/history",
        () => {
          return HttpResponse.json(mockFaceitResponse);
        }
      )
    );

    await expect(
      addMatchTeamMapVeto("1-ff5e99c3-0765-4173-ba2a-398987b1b3ef", 1001, 1002)
    ).rejects.toThrow("Unknown FACEIT map GUID: unknown_map");
  });
});
