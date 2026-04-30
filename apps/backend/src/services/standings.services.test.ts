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

    it("BO2-as-2xBO1 (FORFEIT, FORFEIT): both siblings forfeit in the same room — counts exactly 2 games per team, not 4 (no double-count, S2-AC-1)", async () => {
      // Slot accounting: each of the two sibling FORFEIT rows contributes one
      // slot. Without the per-room forfeit cap, each FORFEIT would expand all
      // `detailed_results` from the FaceIT details API and double-count.
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 81,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 82,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        })
      ] as DbMatchRow[]);

      // FaceIT details API typically returns `detailed_results` for both maps
      // even when the room ended in a double-forfeit (e.g. one team wins both
      // by walkover). Test fixture mirrors that worst-case shape so the cap is
      // exercised.
      mockGetFaceITMatchDetails.mockResolvedValue(
        championshipDetailsTwoGames as never
      );

      const result = await getDivStandings("league-1");

      expect(mockGetFaceitMatchStats).not.toHaveBeenCalled();
      // One details call per sibling row — same FaceIT match id is queried
      // twice, but each row only consumes one `detailed_results` slot.
      expect(mockGetFaceITMatchDetails).toHaveBeenCalledTimes(2);
      expect(mockGetFaceITMatchDetails).toHaveBeenNthCalledWith(1, roomA);
      expect(mockGetFaceITMatchDetails).toHaveBeenNthCalledWith(2, roomA);

      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
      // S2-AC-3 documented exception: when both siblings are FORFEIT,
      // `getFaceitMatchInfoForForfeit` is called twice (once per row) for the
      // same FaceIT match id. With `{ onlyFirstGame: true }` enforced on both
      // rows (the slot-accounting cap), each call returns
      // `detailed_results[0]` — i.e. the same FaceIT-reported slot. The
      // standings layer therefore credits/debits the same outcome twice. This
      // is acceptable for league points: a (FORFEIT, FORFEIT) outcome is
      // typically a no-show by one side, FaceIT reports a single winning
      // faction, and each forfeited slot gives that faction a 3-point win.
      // The cap guarantees no points-inflation beyond two slots.
      expect(teamA?.maps_won).toBe(2);
      expect(teamB?.maps_won).toBe(0);
      expect(teamA?.points).toBe(6);
      expect(teamB?.points).toBe(0);
    });

    it("BO2-as-2xBO1 (FINISHED, FORFEIT): mirrors room 1-f30abfb4-04e1-4d17-8245-b16614e5cf06 — slot 0 forfeit + slot 1 played, exactly 2 games per team", async () => {
      // Mirrors the production room from issue #378 / S2-AC-2. SQL groups the
      // FINISHED row to a single entry; the FORFEIT sibling is processed
      // separately with `onlyFirstGame: true`. Two slots → two games per team.
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 12571,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 12572,
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

      // Exactly two slots counted, no SCHEDULED stragglers, no double-count.
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
      expect(mockGetFaceITMatchDetails).toHaveBeenCalledTimes(1);
      expect(mockGetFaceitMatchStats).toHaveBeenCalledTimes(1);
    });

    it("BO2-as-2xBO1 (FORFEIT, FINISHED): first slot forfeit, second played — same as mixed case, slot order does not matter", async () => {
      // Reverse order to confirm slot 0 forfeit + slot 1 finished produces the
      // same total as (FINISHED, FORFEIT). SQL still collapses the FINISHED to
      // a single grouped row regardless of which sibling holds it.
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 91,
          external_match_room_id: roomA,
          status: MatchStatus.FINISHED,
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 92,
          external_match_room_id: roomA,
          status: "FORFEIT",
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

      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
    });

    it("BO2-as-2xBO1 (FINISHED, FINISHED) regression: both maps played — exactly 2 games per team via grouped FINISHED row", async () => {
      // Regression coverage for S2-AC-1: the (FINISHED, FINISHED) path is the
      // baseline both-played scenario; SQL collapses both siblings into a
      // single grouped row that covers both rounds via `getFaceitMatchStats`.
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

      expect(mockGetFaceITMatchDetails).not.toHaveBeenCalled();
      expect(mockGetFaceitMatchStats).toHaveBeenCalledTimes(1);
      const teamA = result.find((t) => t.team_name === teamAName);
      const teamB = result.find((t) => t.team_name === teamBName);
      expect(teamA?.games_played).toBe(2);
      expect(teamB?.games_played).toBe(2);
    });

    it("BO2-as-2xBO1 idempotency (S2-AC-1): repeated invocations against the same DB snapshot produce identical totals — no point inflation", async () => {
      // Idempotency at the standings layer: the query and aggregation are
      // pure over a fixed Matches snapshot, so repeated calls (e.g. webhook
      // replay → recomputed standings) must yield the same totals. Failure
      // mode this guards: a stateful cache or accumulator persisting between
      // calls and double-counting on the second run.
      mockRunQuery.mockResolvedValue([
        makeMatchRow({
          id: 12571,
          external_match_room_id: roomA,
          status: "FORFEIT",
          is_round_robin_bo2_as_2xbo1: true
        }),
        makeMatchRow({
          id: 12572,
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

      const first = await getDivStandings("league-1");
      const second = await getDivStandings("league-1");

      expect(second).toEqual(first);
      // Both runs must agree on slot count — repeating the query never
      // exceeds the per-room two-slot budget.
      const teamA = second.find((t) => t.team_name === teamAName);
      expect(teamA?.games_played).toBe(2);
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
