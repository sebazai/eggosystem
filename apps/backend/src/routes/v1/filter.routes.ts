import { Router } from "express";
import { knex } from "../../db/knex"; // Your Knex instance
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

  const filter_by_steam_id = req.query.steamId;

  // Parse which data types the frontend wants (comma-separated list)
  const requestedTypes = req.query.types
    ? (req.query.types as string).split(",").map((t) => t.trim())
    : ["season_ids", "team_ids", "league_ids", "stages", "map_ids"]; // Default to all

  // When no filters are applied, we need to fetch all available options
  // This is the initial state where users need to see all possible values
  const hasAnyFilters =
    filter_by_steam_id ||
    season_ids?.length ||
    league_ids?.length ||
    team_ids?.length ||
    stages?.length ||
    map_ids?.length;

  // Build base query with conditional joins based on filters
  let baseQuery = knex("SeasonTeamPlayers as STP");

  // Apply steam_id filter early if present
  if (filter_by_steam_id) {
    baseQuery = baseQuery.where("STP.steam_id", filter_by_steam_id);
  }

  // Apply season and team filters early
  if (season_ids?.length) {
    baseQuery = baseQuery.whereIn("STP.season_id", season_ids);
  }
  if (team_ids?.length) {
    baseQuery = baseQuery.whereIn("STP.team_id", team_ids);
  }

  // Optimize for specific filter combinations that can use direct table queries
  const onlyLeagueFilter =
    !hasAnyFilters ||
    (league_ids?.length &&
      !season_ids?.length &&
      !team_ids?.length &&
      !stages?.length &&
      !map_ids?.length &&
      !filter_by_steam_id);
  const onlySeasonFilter =
    !hasAnyFilters ||
    (season_ids?.length &&
      !league_ids?.length &&
      !team_ids?.length &&
      !stages?.length &&
      !map_ids?.length &&
      !filter_by_steam_id);
  const onlyTeamFilter =
    !hasAnyFilters ||
    (team_ids?.length &&
      !season_ids?.length &&
      !league_ids?.length &&
      !stages?.length &&
      !map_ids?.length &&
      !filter_by_steam_id);

  // When no filters are applied, query source tables directly for better performance
  if (!hasAnyFilters) {
    const queries: Promise<{ id: number }[]>[] = [];

    if (requestedTypes.includes("season_ids")) {
      queries.push(knex("Seasons").select("id").orderBy("id"));
    }

    if (requestedTypes.includes("team_ids")) {
      queries.push(knex("Teams").select("id").orderBy("name"));
    }

    if (requestedTypes.includes("league_ids")) {
      queries.push(knex("Leagues").select("id").orderBy("sort_priority"));
    }

    if (requestedTypes.includes("stages")) {
      queries.push(knex("Stages").select("id"));
    }

    if (requestedTypes.includes("map_ids")) {
      queries.push(knex("Maps").select("id").orderBy("name"));
    }

    // Execute queries and build response
    const results = await Promise.all(queries);

    const grouped: Record<string, number[]> = {};
    let resultIndex = 0;

    if (requestedTypes.includes("season_ids")) {
      grouped.season_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("team_ids")) {
      grouped.team_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("league_ids")) {
      grouped.league_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("stages")) {
      grouped.stages = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("map_ids")) {
      grouped.map_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }

    res.json(grouped);
    return;
  }

  // Optimize for single filter scenarios
  if (onlyLeagueFilter) {
    const queries: Promise<{ id: number }[]>[] = [];

    if (requestedTypes.includes("season_ids")) {
      queries.push(
        knex("SeasonLeagues as SL")
          .join("Seasons as S", "SL.season_id", "S.id")
          .whereIn("SL.league_id", league_ids!)
          .select("S.id")
          .orderBy("S.id")
      );
    }

    if (requestedTypes.includes("team_ids")) {
      queries.push(
        knex("SeasonLeagueTeams as SLT")
          .join("Teams as T", "SLT.team_id", "T.id")
          .whereIn("SLT.league_id", league_ids!)
          .select("T.id")
          .orderBy("T.name")
      );
    }

    if (requestedTypes.includes("league_ids")) {
      queries.push(
        knex("Leagues")
          .whereIn("id", league_ids!)
          .select("id")
          .orderBy("sort_priority")
      );
    }

    if (requestedTypes.includes("stages")) {
      queries.push(
        knex("Matches as M")
          .whereIn("M.league_id", league_ids!)
          .distinct()
          .select("M.stage as id")
          .whereNotNull("M.stage")
          .orderBy("M.stage")
      );
    }

    if (requestedTypes.includes("map_ids")) {
      queries.push(
        knex("Matches as M")
          .join("MatchGames as MG", "M.id", "MG.match_id")
          .whereIn("M.league_id", league_ids!)
          .distinct()
          .select("MG.map_id as id")
          .whereNotNull("MG.map_id")
          .orderBy("MG.map_id")
      );
    }

    const results = await Promise.all(queries);

    const grouped: Record<string, number[]> = {};
    let resultIndex = 0;

    if (requestedTypes.includes("season_ids")) {
      grouped.season_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("team_ids")) {
      grouped.team_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("league_ids")) {
      grouped.league_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("stages")) {
      grouped.stages = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("map_ids")) {
      grouped.map_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }

    res.json(grouped);
    return;
  }

  if (onlySeasonFilter) {
    const queries: Promise<{ id: number }[]>[] = [];

    if (requestedTypes.includes("season_ids")) {
      queries.push(
        knex("Seasons").whereIn("id", season_ids!).select("id").orderBy("id")
      );
    }

    if (requestedTypes.includes("team_ids")) {
      queries.push(
        knex("SeasonTeamPlayers as STP")
          .join("Teams as T", "STP.team_id", "T.id")
          .whereIn("STP.season_id", season_ids!)
          .distinct()
          .select("T.id")
          .orderBy("T.name")
      );
    }

    if (requestedTypes.includes("league_ids")) {
      queries.push(
        knex("SeasonLeagues as SL")
          .join("Leagues as L", "SL.league_id", "L.id")
          .whereIn("SL.season_id", season_ids!)
          .select("L.id")
          .orderBy("L.sort_priority")
      );
    }

    if (requestedTypes.includes("stages")) {
      queries.push(
        knex("Matches as M")
          .whereIn("M.season_id", season_ids!)
          .distinct()
          .select("M.stage as id")
          .whereNotNull("M.stage")
          .orderBy("M.stage")
      );
    }

    if (requestedTypes.includes("map_ids")) {
      queries.push(
        knex("Matches as M")
          .join("MatchGames as MG", "M.id", "MG.match_id")
          .whereIn("M.season_id", season_ids!)
          .distinct()
          .select("MG.map_id as id")
          .whereNotNull("MG.map_id")
          .orderBy("MG.map_id")
      );
    }

    const results = await Promise.all(queries);

    const grouped: Record<string, number[]> = {};
    let resultIndex = 0;

    if (requestedTypes.includes("season_ids")) {
      grouped.season_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("team_ids")) {
      grouped.team_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("league_ids")) {
      grouped.league_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("stages")) {
      grouped.stages = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("map_ids")) {
      grouped.map_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }

    res.json(grouped);
    return;
  }

  if (onlyTeamFilter) {
    const queries: Promise<{ id: number }[]>[] = [];

    if (requestedTypes.includes("season_ids")) {
      queries.push(
        knex("SeasonTeamPlayers as STP")
          .join("Seasons as S", "STP.season_id", "S.id")
          .whereIn("STP.team_id", team_ids!)
          .distinct()
          .select("S.id")
          .orderBy("S.id")
      );
    }

    if (requestedTypes.includes("team_ids")) {
      queries.push(
        knex("Teams").whereIn("id", team_ids!).select("id").orderBy("name")
      );
    }

    if (requestedTypes.includes("league_ids")) {
      queries.push(
        knex("SeasonLeagueTeams as SLT")
          .join("Leagues as L", "SLT.league_id", "L.id")
          .whereIn("SLT.team_id", team_ids!)
          .distinct()
          .select("L.id")
          .orderBy("L.sort_priority")
      );
    }

    if (requestedTypes.includes("stages")) {
      queries.push(
        knex("MatchTeams as MT")
          .join("Matches as M", "MT.match_id", "M.id")
          .whereIn("MT.team_id", team_ids!)
          .distinct()
          .select("M.stage as id")
          .whereNotNull("M.stage")
          .orderBy("M.stage")
      );
    }

    if (requestedTypes.includes("map_ids")) {
      queries.push(
        knex("MatchTeams as MT")
          .join("Matches as M", "MT.match_id", "M.id")
          .join("MatchGames as MG", "M.id", "MG.match_id")
          .whereIn("MT.team_id", team_ids!)
          .distinct()
          .select("MG.map_id as id")
          .whereNotNull("MG.map_id")
          .orderBy("MG.map_id")
      );
    }

    const results = await Promise.all(queries);

    const grouped: Record<string, number[]> = {};
    let resultIndex = 0;

    if (requestedTypes.includes("season_ids")) {
      grouped.season_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("team_ids")) {
      grouped.team_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("league_ids")) {
      grouped.league_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("stages")) {
      grouped.stages = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }
    if (requestedTypes.includes("map_ids")) {
      grouped.map_ids = results[resultIndex++].map(
        (row: { id: number }) => row.id
      );
    }

    res.json(grouped);
    return;
  }

  // When complex filters are applied, use the complex join logic
  const needsMatchData =
    requestedTypes.includes("league_ids") ||
    requestedTypes.includes("stages") ||
    requestedTypes.includes("map_ids") ||
    league_ids?.length ||
    stages?.length ||
    map_ids?.length;
  const needsMapData = requestedTypes.includes("map_ids") || map_ids?.length;

  // Build queries array based on what's requested
  const queries: Promise<{ id: number }[]>[] = [];

  if (requestedTypes.includes("season_ids")) {
    queries.push(
      baseQuery
        .clone()
        .distinct()
        .select("STP.season_id as id")
        .orderBy("STP.season_id")
    );
  }

  if (requestedTypes.includes("team_ids")) {
    queries.push(
      baseQuery
        .clone()
        .distinct()
        .select("STP.team_id as id")
        .orderBy("STP.team_id")
    );
  }

  if (requestedTypes.includes("league_ids") && needsMatchData) {
    queries.push(
      baseQuery
        .clone()
        .leftJoin("MatchTeams as MT", function () {
          this.on("MT.team_id", "STP.team_id").andOn(
            "MT.season_id",
            "STP.season_id"
          );
        })
        .leftJoin("Matches as M", "M.id", "MT.match_id")
        .distinct()
        .select("M.league_id as id")
        .whereNotNull("M.league_id")
        .orderBy("M.league_id")
    );
  }

  if (requestedTypes.includes("stages") && needsMatchData) {
    queries.push(
      baseQuery
        .clone()
        .leftJoin("MatchTeams as MT", function () {
          this.on("MT.team_id", "STP.team_id").andOn(
            "MT.season_id",
            "STP.season_id"
          );
        })
        .leftJoin("Matches as M", "M.id", "MT.match_id")
        .distinct()
        .select("M.stage as id")
        .whereNotNull("M.stage")
        .orderBy("M.stage")
    );
  }

  if (requestedTypes.includes("map_ids") && needsMapData) {
    queries.push(
      baseQuery
        .clone()
        .leftJoin("MatchTeams as MT", function () {
          this.on("MT.team_id", "STP.team_id").andOn(
            "MT.season_id",
            "STP.season_id"
          );
        })
        .leftJoin("Matches as M", "M.id", "MT.match_id")
        .leftJoin("MatchGames as MP", "M.id", "MP.match_id")
        .distinct()
        .select("MP.map_id as id")
        .whereNotNull("MP.map_id")
        .orderBy("MP.map_id")
    );
  }

  // Execute only the queries we need
  const results = await Promise.all(queries);

  // Build response object with only requested data
  const grouped: Record<string, number[]> = {};
  let resultIndex = 0;

  if (requestedTypes.includes("season_ids")) {
    grouped.season_ids = results[resultIndex++].map(
      (row: { id: number }) => row.id
    );
  }
  if (requestedTypes.includes("team_ids")) {
    grouped.team_ids = results[resultIndex++].map(
      (row: { id: number }) => row.id
    );
  }
  if (requestedTypes.includes("league_ids")) {
    grouped.league_ids = results[resultIndex++].map(
      (row: { id: number }) => row.id
    );
  }
  if (requestedTypes.includes("stages")) {
    grouped.stages = results[resultIndex++].map(
      (row: { id: number }) => row.id
    );
  }
  if (requestedTypes.includes("map_ids")) {
    grouped.map_ids = results[resultIndex++].map(
      (row: { id: number }) => row.id
    );
  }

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
