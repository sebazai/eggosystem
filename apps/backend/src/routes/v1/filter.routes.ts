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
  const filter_by_player_name = req.query.player_name as string | undefined;

  // Check which dimensions need joins based on filters
  // Only optimize seasons and teams - leagues/stages/maps always need their respective joins
  const hasSeasonFilters = Boolean(
    league_ids?.length || stages?.length || team_ids?.length || map_ids?.length
  );
  const hasTeamFilters = Boolean(
    season_ids?.length ||
    league_ids?.length ||
    stages?.length ||
    map_ids?.length
  );

  // Build parameterized query parts
  const queryParams: (string | number)[] = [];

  // Helper to build IN clause
  const buildInClause = (values: number[] | null): string => {
    if (!values?.length) return "1=1";
    return values.map(() => "?").join(", ");
  };

  // Each subquery needs steamId and player_name parameters
  const steamIdParam = filter_by_steam_id || "";
  const playerNameLikeParam = filter_by_player_name
    ? `%${filter_by_player_name}%`
    : "";

  // Helper to build player filter EXISTS clause
  const buildPlayerFilter = () => {
    if (!filter_by_steam_id && !filter_by_player_name) {
      return "";
    }
    return `
      EXISTS (
        SELECT 1 FROM SeasonTeamPlayers AS STP
        ${filter_by_player_name ? `INNER JOIN SteamPlayers AS SP ON SP.steam_id = STP.steam_id` : ""}
        WHERE STP.team_id = MT.team_id 
          AND STP.season_id = M.season_id
          ${filter_by_steam_id ? `AND STP.steam_id = ?` : ""}
          ${filter_by_player_name ? `AND (SP.nickname LIKE ? OR SP.faceit_nickname LIKE ?)` : ""}
      )
    `;
  };

  // For ValidSeasons subquery
  if (hasSeasonFilters) {
    // Player filter params (steamId and/or player_name)
    if (filter_by_steam_id) queryParams.push(steamIdParam);
    if (filter_by_player_name)
      queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
    // Dimension filters
    if (team_ids?.length) queryParams.push(...team_ids);
    if (league_ids?.length) queryParams.push(...league_ids);
    if (stages?.length) queryParams.push(...stages);
    if (map_ids?.length) queryParams.push(...map_ids);
  } else {
    // Fast path parameters
    queryParams.push(steamIdParam, steamIdParam);
    if (filter_by_player_name)
      queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
  }

  // For ValidLeagues subquery
  if (filter_by_steam_id) queryParams.push(steamIdParam);
  if (filter_by_player_name)
    queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
  if (season_ids?.length) queryParams.push(...season_ids);
  if (team_ids?.length) queryParams.push(...team_ids);
  if (stages?.length) queryParams.push(...stages);
  if (map_ids?.length) queryParams.push(...map_ids);

  // For ValidTeams subquery
  if (hasTeamFilters) {
    // Player filter params
    if (filter_by_steam_id) queryParams.push(steamIdParam);
    if (filter_by_player_name)
      queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
    // Dimension filters
    if (season_ids?.length) queryParams.push(...season_ids);
    if (league_ids?.length) queryParams.push(...league_ids);
    if (stages?.length) queryParams.push(...stages);
    if (map_ids?.length) queryParams.push(...map_ids);
  } else {
    // Fast path parameters
    queryParams.push(steamIdParam, steamIdParam);
    if (filter_by_player_name)
      queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
  }

  // For ValidStages subquery
  if (filter_by_steam_id) queryParams.push(steamIdParam);
  if (filter_by_player_name)
    queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
  if (season_ids?.length) queryParams.push(...season_ids);
  if (team_ids?.length) queryParams.push(...team_ids);
  if (league_ids?.length) queryParams.push(...league_ids);
  if (map_ids?.length) queryParams.push(...map_ids);

  // For ValidMaps subquery
  if (filter_by_steam_id) queryParams.push(steamIdParam);
  if (filter_by_player_name)
    queryParams.push(playerNameLikeParam, playerNameLikeParam); // Two params for OR condition
  if (season_ids?.length) queryParams.push(...season_ids);
  if (team_ids?.length) queryParams.push(...team_ids);
  if (league_ids?.length) queryParams.push(...league_ids);
  if (stages?.length) queryParams.push(...stages);
  // Query each dimension - use INNER JOINs only when necessary
  const query = `
    SELECT
      -- Valid seasons (optimize: no joins if no cross-dimension filters)
      COALESCE(
        (${
          !hasSeasonFilters
            ? `
          SELECT GROUP_CONCAT(DISTINCT STP.season_id ORDER BY STP.season_id)
          FROM SeasonTeamPlayers AS STP
          ${filter_by_player_name ? `INNER JOIN SteamPlayers AS SP ON SP.steam_id = STP.steam_id` : ""}
          WHERE (? = '' OR STP.steam_id = ?)
            ${filter_by_player_name ? `AND (SP.nickname LIKE ? OR SP.faceit_nickname LIKE ?)` : ""}
         `
            : `
          SELECT GROUP_CONCAT(DISTINCT M.season_id ORDER BY M.season_id)
          FROM MatchTeams AS MT
          INNER JOIN Matches AS M ON M.id = MT.match_id
          ${map_ids?.length ? `INNER JOIN MatchGames AS MP ON M.id = MP.match_id` : ""}
          WHERE 1=1
            ${buildPlayerFilter() ? `AND ${buildPlayerFilter()}` : ""}
            ${team_ids?.length ? `AND MT.team_id IN (${buildInClause(team_ids)})` : ""}
            ${league_ids?.length ? `AND M.league_id IN (${buildInClause(league_ids)})` : ""}
            ${stages?.length ? `AND M.stage IN (${buildInClause(stages)})` : ""}
            ${map_ids?.length ? `AND MP.map_id IN (${buildInClause(map_ids)})` : ""}
         `
        }), ''
      ) as season_ids,
      
      -- Valid leagues (always needs Matches join)
      COALESCE(
        (SELECT GROUP_CONCAT(DISTINCT M.league_id ORDER BY M.league_id)
         FROM MatchTeams AS MT
         INNER JOIN Matches AS M ON M.id = MT.match_id
         ${map_ids?.length ? `INNER JOIN MatchGames AS MP ON M.id = MP.match_id` : ""}
         WHERE 1=1
           ${buildPlayerFilter() ? `AND ${buildPlayerFilter()}` : ""}
           ${season_ids?.length ? `AND M.season_id IN (${buildInClause(season_ids)})` : ""}
           ${team_ids?.length ? `AND MT.team_id IN (${buildInClause(team_ids)})` : ""}
           ${stages?.length ? `AND M.stage IN (${buildInClause(stages)})` : ""}
           ${map_ids?.length ? `AND MP.map_id IN (${buildInClause(map_ids)})` : ""}
           AND M.league_id IS NOT NULL
        ), ''
      ) as league_ids,
      
      -- Valid teams (optimize: no joins if no cross-dimension filters)
      COALESCE(
        (${
          !hasTeamFilters
            ? `
          SELECT GROUP_CONCAT(DISTINCT STP.team_id ORDER BY STP.team_id)
          FROM SeasonTeamPlayers AS STP
          ${filter_by_player_name ? `INNER JOIN SteamPlayers AS SP ON SP.steam_id = STP.steam_id` : ""}
          WHERE (? = '' OR STP.steam_id = ?)
            ${filter_by_player_name ? `AND (SP.nickname LIKE ? OR SP.faceit_nickname LIKE ?)` : ""}
         `
            : `
          SELECT GROUP_CONCAT(DISTINCT MT.team_id ORDER BY MT.team_id)
          FROM MatchTeams AS MT
          INNER JOIN Matches AS M ON M.id = MT.match_id
          ${map_ids?.length ? `INNER JOIN MatchGames AS MP ON M.id = MP.match_id` : ""}
          WHERE 1=1
            ${buildPlayerFilter() ? `AND ${buildPlayerFilter()}` : ""}
            ${season_ids?.length ? `AND M.season_id IN (${buildInClause(season_ids)})` : ""}
            ${league_ids?.length ? `AND M.league_id IN (${buildInClause(league_ids)})` : ""}
            ${stages?.length ? `AND M.stage IN (${buildInClause(stages)})` : ""}
            ${map_ids?.length ? `AND MP.map_id IN (${buildInClause(map_ids)})` : ""}
         `
        }), ''
      ) as team_ids,
      
      -- Valid stages (always needs Matches join)
      COALESCE(
        (SELECT GROUP_CONCAT(DISTINCT M.stage ORDER BY M.stage)
         FROM MatchTeams AS MT
         INNER JOIN Matches AS M ON M.id = MT.match_id
         ${map_ids?.length ? `INNER JOIN MatchGames AS MP ON M.id = MP.match_id` : ""}
         WHERE 1=1
           ${buildPlayerFilter() ? `AND ${buildPlayerFilter()}` : ""}
           ${season_ids?.length ? `AND M.season_id IN (${buildInClause(season_ids)})` : ""}
           ${team_ids?.length ? `AND MT.team_id IN (${buildInClause(team_ids)})` : ""}
           ${league_ids?.length ? `AND M.league_id IN (${buildInClause(league_ids)})` : ""}
           ${map_ids?.length ? `AND MP.map_id IN (${buildInClause(map_ids)})` : ""}
           AND M.stage IS NOT NULL
        ), ''
      ) as stages,
      
      -- Valid maps (always needs MatchGames join)
      COALESCE(
        (SELECT GROUP_CONCAT(DISTINCT MP.map_id ORDER BY MP.map_id)
         FROM MatchTeams AS MT
         INNER JOIN Matches AS M ON M.id = MT.match_id
         INNER JOIN MatchGames AS MP ON M.id = MP.match_id
         WHERE 1=1
           ${buildPlayerFilter() ? `AND ${buildPlayerFilter()}` : ""}
           ${season_ids?.length ? `AND M.season_id IN (${buildInClause(season_ids)})` : ""}
           ${team_ids?.length ? `AND MT.team_id IN (${buildInClause(team_ids)})` : ""}
           ${league_ids?.length ? `AND M.league_id IN (${buildInClause(league_ids)})` : ""}
           ${stages?.length ? `AND M.stage IN (${buildInClause(stages)})` : ""}
           AND MP.map_id IS NOT NULL
        ), ''
      ) as map_ids;
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
