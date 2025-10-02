import { Router } from "express";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  getFilteredTeamIdDetailsController,
  getFilteredTeamsController,
  getFilteredTeamMapStatsController,
  getFilteredTeamMatchHistoryController,
  getFilteredTeamIdController,
  getFilteredTopTeamsController
} from "../../controllers/teams.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getFilteredMultipleLeaderboardsController,
  getSingleLeaderboardController
} from "../../controllers/leaderboards.controllers";
import {
  getAllFilteredPlayerStatisticsController,
  getFilteredPlayerGameDetailsController,
  getFilteredPlayerTeamDetailsController,
  getFilteredPlayerMatchHistoryController,
  getFilteredPlayersStatsController,
  getPlayerSkillDiagramController,
  getMultiplePlayersSkillDiagramController,
  getFilteredPlayerMapStatsController,
  getFilteredAllPlayersStatsController
} from "../../controllers/players.controllers";
import { getFilteredMatchesController } from "../../controllers/matches.controllers";
import { getTeamPistolWinsController } from "../../controllers/pistol-wins.controllers";
import { getTeamPlantStatsController } from "../../controllers/plant-stats.controllers";
import { getTeamRetakeStatsController } from "../../controllers/retake-stats.controllers";
import { getTeamEnhancedMapStatsController } from "../../controllers/team-map-stats.controllers";

const router = Router();

router.get("/", async (req, res) => {
  const { season_ids, league_ids, team_ids, stages, map_ids } =
    req.parsedParams;

  const filter_by_steam_id = req.query.steamId as string | undefined;

  const whereConditions: string[] = [];
  const queryParams: (string | number)[] = [];

  if (filter_by_steam_id) {
    whereConditions.push("STP.steam_id = ?");
    queryParams.push(filter_by_steam_id);
  }
  if (season_ids?.length) {
    whereConditions.push(
      `STP.season_id IN (${season_ids.map(() => "?").join(", ")})`
    );
    queryParams.push(...season_ids);
  }
  if (league_ids?.length) {
    whereConditions.push(
      `M.league_id IN (${league_ids.map(() => "?").join(", ")})`
    );
    queryParams.push(...league_ids);
  }
  if (team_ids?.length) {
    whereConditions.push(
      `STP.team_id IN (${team_ids.map(() => "?").join(", ")})`
    );
    queryParams.push(...team_ids);
  }
  if (stages?.length) {
    whereConditions.push(`M.stage IN (${stages.map(() => "?").join(", ")})`);
    queryParams.push(...stages);
  }
  if (map_ids?.length) {
    whereConditions.push(`MP.map_id IN (${map_ids.map(() => "?").join(", ")})`);
    queryParams.push(...map_ids);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const query = `
    SELECT DISTINCT
      GROUP_CONCAT(DISTINCT STP.season_id ORDER BY STP.season_id) as season_ids,
      GROUP_CONCAT(DISTINCT COALESCE(M.league_id, '') ORDER BY M.league_id) as league_ids,
      GROUP_CONCAT(DISTINCT STP.team_id ORDER BY STP.team_id) as team_ids,
      GROUP_CONCAT(DISTINCT COALESCE(M.stage, '') ORDER BY M.stage) as stages,
      GROUP_CONCAT(DISTINCT COALESCE(MP.map_id, '') ORDER BY MP.map_id) as map_ids
    FROM SeasonTeamPlayers as STP
    LEFT JOIN MatchTeams as MT ON MT.team_id = STP.team_id
    LEFT JOIN Matches as M ON M.id = MT.match_id AND M.season_id = STP.season_id
    LEFT JOIN MatchGames as MP ON M.id = MP.match_id
    ${whereClause}
  `;

  const [result] = await runQuery<
    {
      season_ids: string;
      league_ids: string;
      team_ids: string;
      stages: string;
      map_ids: string;
    }[]
  >(query, queryParams);

  // Parse the concatenated string back into arrays and filter out empty values
  const grouped = {
    season_ids: result.season_ids
      ? result.season_ids.split(",").map(Number)
      : [],
    league_ids: result.league_ids
      ? result.league_ids
          .split(",")
          .filter((id: string) => id !== "")
          .map(Number)
      : [],
    team_ids: result.team_ids ? result.team_ids.split(",").map(Number) : [],
    stages: result.stages
      ? result.stages
          .split(",")
          .filter((stage: string) => stage !== "")
          .map(Number)
      : [],
    map_ids: result.map_ids
      ? result.map_ids
          .split(",")
          .filter((id: string) => id !== "")
          .map(Number)
      : []
  };

  res.json(grouped);
});

// Player
router.get("/players/stats", getFilteredPlayersStatsController);
router.get("/players/all/stats", getFilteredAllPlayersStatsController);
router.get(
  "/players/:steam_id/statistics",
  getAllFilteredPlayerStatisticsController
);
router.get(
  "/players/:steam_id/game-details",
  getFilteredPlayerGameDetailsController
);
router.get("/players/:steam_id/teams", getFilteredPlayerTeamDetailsController);
router.get(
  "/players/:steam_id/match-history",
  getFilteredPlayerMatchHistoryController
);
router.get("/players/:steam_id/skill-diagram", getPlayerSkillDiagramController);
router.get(
  "/players/skill-diagram/aggregate",
  getMultiplePlayersSkillDiagramController
);
router.get("/players/:steam_id/map-stats", getFilteredPlayerMapStatsController);

// Leaderboard
router.get("/leaderboards/multiple", getFilteredMultipleLeaderboardsController);
router.get("/leaderboards", getSingleLeaderboardController);

// Matches
router.get("/matches/recent", getFilteredMatchesController);

// Teams
router.get("/teams/topteams", getFilteredTopTeamsController);
router.get("/teams", getFilteredTeamsController);
router.get(
  "/teams/:team_id",
  validateNumericParams(),
  getFilteredTeamIdController
);
router.get(
  "/teams/:team_id/details",
  validateNumericParams(),
  getFilteredTeamIdDetailsController
);
router.get(
  "/teams/:team_id/match-history",
  validateNumericParams(),
  getFilteredTeamMatchHistoryController
);
router.get(
  "/teams/:team_id/map-stats",
  validateNumericParams(),
  getFilteredTeamMapStatsController
);
router.get(
  "/teams/:team_id/enhanced-map-stats",
  validateNumericParams(["team_id"]),
  getTeamEnhancedMapStatsController
);

router.get(
  "/stats/teams/:teamId/pistol-wins",
  validateNumericParams(),
  getTeamPistolWinsController
);
router.get(
  "/stats/teams/:teamId/plant-stats",
  validateNumericParams(),
  getTeamPlantStatsController
);
router.get(
  "/stats/teams/:teamId/retake-stats",
  validateNumericParams(),
  getTeamRetakeStatsController
);

export default router;
