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
  getFilteredPlayerStatisticsController,
  getFilteredPlayerGameDetailsController,
  getFilteredPlayerTeamDetailsController,
  getFilteredPlayerMatchHistoryController,
  getFilteredPlayersStatsController
} from "../../controllers/players.controllers";
import { getFilteredMatchesController } from "../../controllers/matches.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get("/", async (req, res) => {
  const { season_ids, league_ids, team_ids, stages, map_ids } =
    req.parsedParams;

  const filter_by_steam_id = req.query.steamId;

  let query = knex("Matches as M")
    .distinct()
    .select(
      knex.raw(
        "GROUP_CONCAT(DISTINCT M.season_id ORDER BY M.season_id) as season_ids"
      ),
      knex.raw(
        "GROUP_CONCAT(DISTINCT M.league_id ORDER BY M.league_id) as league_ids"
      ),
      knex.raw(
        "GROUP_CONCAT(DISTINCT MT.team_id ORDER BY MT.team_id) as team_ids"
      ),
      knex.raw("GROUP_CONCAT(DISTINCT M.stage ORDER BY M.stage) as stages"),
      knex.raw("GROUP_CONCAT(DISTINCT MP.map_id ORDER BY MP.map_id) as map_ids")
    )
    .join("MatchTeams as MT", "M.id", "MT.match_id")
    .join("MatchGames as MP", "M.id", "MP.match_id");

  if (filter_by_steam_id) {
    query = query
      .join("SeasonTeamPlayers as STP", function () {
        this.on("STP.season_id", "MT.season_id").andOn(
          "STP.team_id",
          "MT.team_id"
        );
      })
      .where("STP.steam_id", filter_by_steam_id);
  }

  if (season_ids?.length) {
    query = query.whereIn("M.season_id", season_ids);
  }
  if (league_ids?.length) {
    query = query.whereIn("M.league_id", league_ids);
  }
  if (team_ids?.length) {
    query = query.whereIn("MT.team_id", team_ids);
  }
  if (stages?.length) {
    query = query.whereIn("M.stage", stages);
  }
  if (map_ids?.length) {
    query = query.whereIn("MP.map_id", map_ids);
  }

  const [result] = await query;

  // Parse the concatenated string back into arrays
  const grouped = {
    season_ids: result.season_ids
      ? result.season_ids.split(",").map(Number)
      : [],
    league_ids: result.league_ids
      ? result.league_ids.split(",").map(Number)
      : [],
    team_ids: result.team_ids ? result.team_ids.split(",").map(Number) : [],
    stages: result.stages ? result.stages.split(",").map(Number) : [],
    map_ids: result.map_ids ? result.map_ids.split(",").map(Number) : []
  };

  res.json(grouped);
});

// Player
router.get("/players/stats", getFilteredPlayersStatsController);
router.get(
  "/players/:steam_id/statistics",
  getFilteredPlayerStatisticsController
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

// Leaderboard
router.get(
  "/leaderboards/multiple",
  parseQueryFilterParams,
  getFilteredMultipleLeaderboardsController
);
router.get(
  "/leaderboards",
  parseQueryFilterParams,
  getSingleLeaderboardController
);

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

export default router;
