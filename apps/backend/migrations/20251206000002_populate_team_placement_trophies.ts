import type { Knex } from "knex";

/**
 * Migration to populate TrophyAssignments with historical team placements
 * from SeasonLeagueTeams table.
 *
 * This assigns season placement trophies (winner, 2nd, 3rd) to teams.
 * Players can see these trophies via a JOIN through SeasonTeamPlayers.
 */
export async function up(knex: Knex): Promise<void> {
  // Get trophy IDs for season placements
  const trophies = await knex("Trophies")
    .select("id", "name", "placement")
    .whereIn("name", ["season_winner", "season_2nd", "season_3rd"]);

  const trophyMap: Record<number, number> = {};
  for (const trophy of trophies) {
    trophyMap[trophy.placement] = trophy.id;
  }

  // Get all team placements (1st, 2nd, 3rd) from SeasonLeagueTeams
  const placements = await knex("SeasonLeagueTeams")
    .select("season_id", "league_id", "team_id", "placement")
    .whereNotNull("placement")
    .where("placement", "<=", 3)
    .orderBy([
      { column: "season_id", order: "asc" },
      { column: "league_id", order: "asc" },
      { column: "placement", order: "asc" }
    ]);

  // Insert trophy assignments for each placement
  const assignments = placements
    .filter((p) => trophyMap[p.placement]) // Only insert if trophy exists
    .map((p) => ({
      trophy_id: trophyMap[p.placement],
      team_id: p.team_id,
      steam_id: null, // Team trophy, not player
      season_id: p.season_id,
      league_id: p.league_id,
      custom_text: null
    }));

  if (assignments.length > 0) {
    // Insert in batches to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      await knex("TrophyAssignments").insert(batch);
    }
  }

  console.log(`Inserted ${assignments.length} team placement trophies`);
}

export async function down(knex: Knex): Promise<void> {
  // Remove all season placement trophies (assigned to teams)
  const trophyIds = await knex("Trophies")
    .select("id")
    .whereIn("name", ["season_winner", "season_2nd", "season_3rd"]);

  if (trophyIds.length > 0) {
    await knex("TrophyAssignments")
      .whereIn(
        "trophy_id",
        trophyIds.map((t) => t.id)
      )
      .whereNotNull("team_id")
      .delete();
  }
}
