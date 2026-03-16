import { runQuery } from "../db/mysqlRunQuery";
import {
  getTeamIdsByExternalIds,
  getPlayoffSeedsBySeasonAndLeague,
  getPlayoffSeedMapBySeasonAndLeague,
  updatePlayoffSeeds
} from "./season-league-team.models";

jest.mock("../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("season-league-team.models (playoff)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamIdsByExternalIds", () => {
    it("returns empty map for empty externalIds", async () => {
      const result = await getTeamIdsByExternalIds(14, []);
      expect(result).toEqual(new Map());
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("returns map of external_team_id -> team_id", async () => {
      mockRunQuery.mockResolvedValue([
        { team_id: 10, external_team_id: "ext-a" },
        { team_id: 20, external_team_id: "ext-b" }
      ]);

      const result = await getTeamIdsByExternalIds(14, ["ext-a", "ext-b"]);

      expect(result).toEqual(
        new Map([
          ["ext-a", 10],
          ["ext-b", 20]
        ])
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SeasonLeagueTeams"),
        [14, "ext-a", "ext-b"],
        undefined
      );
    });
  });

  describe("getPlayoffSeedsBySeasonAndLeague", () => {
    it("returns teams with playoff_seed ordered by seed", async () => {
      mockRunQuery.mockResolvedValue([
        { team_id: 10, team_name: "Team A", playoff_seed: 1 },
        { team_id: 20, team_name: "Team B", playoff_seed: 2 },
        { team_id: 30, team_name: "Team C", playoff_seed: null }
      ]);

      const result = await getPlayoffSeedsBySeasonAndLeague(14, 1);

      expect(result).toEqual([
        { team_id: 10, team_name: "Team A", playoff_seed: 1 },
        { team_id: 20, team_name: "Team B", playoff_seed: 2 },
        { team_id: 30, team_name: "Team C", playoff_seed: null }
      ]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("playoff_seed"),
        [14, 1]
      );
    });
  });

  describe("getPlayoffSeedMapBySeasonAndLeague", () => {
    it("returns map of team_id -> playoff_seed", async () => {
      mockRunQuery.mockResolvedValue([
        { team_id: 10, playoff_seed: 1 },
        { team_id: 20, playoff_seed: 2 }
      ]);

      const result = await getPlayoffSeedMapBySeasonAndLeague(14, 1);

      expect(result).toEqual(
        new Map([
          [10, 1],
          [20, 2]
        ])
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("playoff_seed IS NOT NULL"),
        [14, 1]
      );
    });
  });

  describe("updatePlayoffSeeds", () => {
    it("does nothing when updates is empty", async () => {
      await updatePlayoffSeeds(14, 1, []);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("runs UPDATE for each entry", async () => {
      mockRunQuery.mockResolvedValue([]);

      await updatePlayoffSeeds(14, 1, [
        { team_id: 10, playoff_seed: 1 },
        { team_id: 20, playoff_seed: 2 }
      ]);

      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("UPDATE SeasonLeagueTeams"),
        [1, 14, 1, 10]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE SeasonLeagueTeams"),
        [2, 14, 1, 20]
      );
    });
  });
});
