import { Router } from "express";
import parseParams from "../../middlewares/parseParams";
import { knex } from "../../db/knex"; // Your Knex instance

const router = Router();

router.get("/", parseParams, async (req, res) => {
  const { season_ids, league_ids, team_ids, stages, map_ids } =
    req.parsedParams;

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
    .join("MatchMapsPlayed as MP", "M.id", "MP.match_id");

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

export default router;
