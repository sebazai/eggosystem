import { MatchStatus } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getDivStandings } from "./standings.services";
import * as faceitServices from "./faceit.services";

jest.mock("../db/mysqlRunQuery");
jest.mock("./faceit.services");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetFaceITMatchDetails =
  faceitServices.getFaceITMatchDetails as jest.MockedFunction<
    typeof faceitServices.getFaceITMatchDetails
  >;
const mockGetFaceitMatchStats =
  faceitServices.getFaceitMatchStats as jest.MockedFunction<
    typeof faceitServices.getFaceitMatchStats
  >;

type DbMatchRow = {
  id: number;
  external_match_room_id: string | null;
  status: string;
  best_of: number;
  is_round_robin_bo2_as_2xbo1: boolean;
};

function makeMatchRow(
  overrides: Partial<DbMatchRow> & { external_match_room_id: string }
): DbMatchRow {
  return {
    id: 1,
    status: "FINISHED",
    best_of: 1,
    is_round_robin_bo2_as_2xbo1: false,
    ...overrides
  };
}

const roomA = "room-a-111";
const roomB = "room-b-222";
const teamAName = "Team Alpha";
const teamBName = "Team Beta";

const championshipDetailsOneGame = {
  teams: {
    faction1: { name: teamAName },
    faction2: { name: teamBName }
  },
  detailed_results: [{ winner: "faction1" as const }]
};

const championshipDetailsTwoGames = {
  teams: {
    faction1: { name: teamAName },
    faction2: { name: teamBName }
  },
  detailed_results: [
    { winner: "faction1" as const },
    { winner: "faction2" as const }
  ]
};

const faceitMatchStatsOneRound = {
  rounds: [
    {
      round_stats: { Rounds: "24" },
      teams: [
        { team_stats: { Team: teamAName, "Final Score": "13" } },
        { team_stats: { Team: teamBName, "Final Score": "8" } }
      ]
    }
  ]
};

const faceitMatchStatsTwoRounds = {
  rounds: [
    {
      round_stats: { Rounds: "24" },
      teams: [
        { team_stats: { Team: teamAName, "Final Score": "13" } },
        { team_stats: { Team: teamBName, "Final Score": "5" } }
      ]
    },
    {
      round_stats: { Rounds: "24" },
      teams: [
        { team_stats: { Team: teamAName, "Final Score": "10" } },
        { team_stats: { Team: teamBName, "Final Score": "13" } }
      ]
    }
  ]
};

describe("standings.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDivStandings", () => {
    it("returns empty array when no matches", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getDivStandings("league-1");

      expect(result).toEqual([]);
      expect(mockGetFaceITMatchDetails).not.toHaveBeenCalled();
      expect(mockGetFaceitMatchStats).not.toHaveBeenCalled();
    });

    it("filters out matches with null external_match_room_id", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: "valid-room",
          status: "FINISHED",
          is_round_robin_bo2_as_2xbo1: false
        }),
        {
          id: 2,
          external_match_room_id: null,
          status: "FINISHED",
          best_of: 1,
          is_round_robin_bo2_as_2xbo1: false
        }
      ] as DbMatchRow[]);

      mockGetFaceitMatchStats.mockResolvedValue(
        faceitMatchStatsOneRound as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceitMatchStats).toHaveBeenCalledTimes(1);
      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith("valid-room");
      expect(result).toHaveLength(2);
      expect(result.find((t) => t.team_name === teamAName)?.games_played).toBe(
        1
      );
    });

    it("processes one FINISHED match and returns combined stats", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: roomA,
          status: "FINISHED",
          is_round_robin_bo2_as_2xbo1: false
        })
      ] as DbMatchRow[]);

      mockGetFaceitMatchStats.mockResolvedValue(
        faceitMatchStatsOneRound as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith(roomA);
      expect(result).toHaveLength(2);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(1);
      expect(teamB?.games_played).toBe(1);
      expect(teamA?.points).toBe(3);
      expect(teamB?.points).toBe(0);
    });

    it("BO2-as-2xBO1: one room with single FINISHED row (grouped) returns stats for that room", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: roomA,
          status: "FINISHED",
          is_round_robin_bo2_as_2xbo1: true
        })
      ] as DbMatchRow[]);

      mockGetFaceitMatchStats.mockResolvedValue(
        faceitMatchStatsTwoRounds as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceitMatchStats).toHaveBeenCalledTimes(1);
      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith(roomA);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
    });

    it("BO2-as-2xBO1: FORFEIT-only room uses all detailed_results from details API", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        })
      ] as DbMatchRow[]);

      mockGetFaceITMatchDetails.mockResolvedValue(
        championshipDetailsOneGame as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceITMatchDetails).toHaveBeenCalledWith(roomA);
      expect(mockGetFaceitMatchStats).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(1);
      expect(teamB?.games_played).toBe(1);
      expect(teamA?.points).toBe(3);
      expect(teamB?.points).toBe(0);
    });

    it("BO2-as-2xBO1: room with FORFEIT + FINISHED counts only one forfeit game and one played (no double-count)", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 71,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 72,
          external_match_room_id: roomA,
          status: MatchStatus.FINISHED,
          is_round_robin_bo2_as_2xbo1: true
        })
      ] as DbMatchRow[]);

      mockGetFaceITMatchDetails.mockResolvedValue(
        championshipDetailsTwoGames as never
      );
      mockGetFaceitMatchStats.mockResolvedValue(
        faceitMatchStatsOneRound as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceITMatchDetails).toHaveBeenCalledWith(roomA);
      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith(roomA);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
    });

    it("BO2-as-2xBO1: multiple rooms including one FORFEIT+FINISHED and others FINISHED", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: roomA,
          status: "FINISHED",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 71,
          external_match_room_id: roomB,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 72,
          external_match_room_id: roomB,
          status: MatchStatus.FINISHED,
          is_round_robin_bo2_as_2xbo1: true
        })
      ] as DbMatchRow[]);

      mockGetFaceitMatchStats
        .mockResolvedValueOnce(faceitMatchStatsTwoRounds as never)
        .mockResolvedValueOnce(faceitMatchStatsOneRound as never);
      mockGetFaceITMatchDetails.mockResolvedValue(
        championshipDetailsTwoGames as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith(roomA);
      expect(mockGetFaceitMatchStats).toHaveBeenCalledWith(roomB);
      expect(mockGetFaceITMatchDetails).toHaveBeenCalledWith(roomB);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(4);
      expect(teamB?.games_played).toBe(4);
    });

    it("sorts by points then rounds_diff", async () => {
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 1,
          external_match_room_id: roomA,
          status: "FINISHED",
          is_round_robin_bo2_as_2xbo1: false
        })
      ] as DbMatchRow[]);

      mockGetFaceitMatchStats.mockResolvedValue(
        faceitMatchStatsOneRound as never
      );

      const result = await getDivStandings("league-1");

      expect(result[0].team_name).toBe(teamAName);
      expect(result[0].points).toBe(3);
      expect(result[1].team_name).toBe(teamBName);
      expect(result[1].points).toBe(0);
    });
  });
});
