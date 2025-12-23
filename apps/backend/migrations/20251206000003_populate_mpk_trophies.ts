import type { Knex } from "knex";

/**
 * Migration to create MKP (Most Kana Player) trophies and populate them
 * for all seasons and divisions based on kana_rating leaderboard.
 *
 * Awards top 3 kana rating players per division per season (regular stage only).
 */
export async function up(knex: Knex): Promise<void> {
  // First, add the new MKP trophy types (they use kanarating category)
  // Check if they already exist to avoid duplicates
  const existingTrophies = await knex("Trophies")
    .select("name")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  const existingNames = existingTrophies.map((t) => t.name);

  // Trophies already exist from the initial migration - just update display_name if needed
  if (existingNames.includes("kanarating_top1")) {
    await knex("Trophies")
      .where("name", "kanarating_top1")
      .update({ display_name: "{league} Kanarating #1" });
  }
  if (existingNames.includes("kanarating_top2")) {
    await knex("Trophies")
      .where("name", "kanarating_top2")
      .update({ display_name: "{league} Kanarating #2" });
  }
  if (existingNames.includes("kanarating_top3")) {
    await knex("Trophies")
      .where("name", "kanarating_top3")
      .update({ display_name: "{league} Kanarating #3" });
  }

  // Get trophy IDs for kanarating trophies
  const trophies = await knex("Trophies")
    .select("id", "name", "placement")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  const trophyMap: Record<number, number> = {};
  for (const trophy of trophies) {
    trophyMap[trophy.placement] = trophy.id;
  }

  // Get all unique season/league combinations that have matches
  const seasonLeagues = await knex.raw(`
    SELECT DISTINCT m.season_id, m.league_id
    FROM Matches m
    WHERE m.stage = 1
      AND m.league_id IS NOT NULL
    ORDER BY m.season_id, m.league_id
  `);

  // For each season/league combination, get top 3 kana rating players
  for (const sl of seasonLeagues[0]) {
    const { season_id, league_id } = sl;

    // Query top 3 kana rating players for this season/league (regular stage only)
    const topPlayers = await knex.raw(
      `
      SELECT 
        p.steam_id,
        p.nickname,
        COUNT(DISTINCT mg.id) AS maps_played,
        AVG(ps.kana_rating) AS kana_rating
      FROM SteamPlayers p
      JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      JOIN MatchGames mg ON mg.id = ps.match_game_id
      JOIN Matches m ON m.id = mg.match_id
      JOIN MatchTeams mt ON mt.match_id = m.id
      JOIN SeasonTeamPlayers stp 
        ON stp.steam_id = p.steam_id 
        AND stp.team_id = mt.team_id
        AND stp.season_id = m.season_id
        AND stp.role = 'primary'
      WHERE m.season_id = ?
        AND m.league_id = ?
        AND m.stage = 1
      GROUP BY p.steam_id, p.nickname
      HAVING COUNT(DISTINCT mg.id) > 2
      ORDER BY kana_rating DESC
      LIMIT 3
    `,
      [season_id, league_id]
    );

    // Assign trophies to top 3 players
    const players = topPlayers[0];
    for (let i = 0; i < players.length; i++) {
      const placement = i + 1; // 1, 2, or 3
      const trophyId = trophyMap[placement];

      if (!trophyId) continue;

      const player = players[i];

      // Check if assignment already exists
      const existing = await knex("TrophyAssignments")
        .where({
          trophy_id: trophyId,
          steam_id: player.steam_id,
          season_id: season_id,
          league_id: league_id
        })
        .first();

      if (!existing) {
        await knex("TrophyAssignments").insert({
          trophy_id: trophyId,
          team_id: null,
          steam_id: player.steam_id,
          season_id: season_id,
          league_id: league_id,
          custom_text: null
        });
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove all kanarating trophy assignments (player trophies)
  const trophyIds = await knex("Trophies")
    .select("id")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  if (trophyIds.length > 0) {
    await knex("TrophyAssignments")
      .whereIn(
        "trophy_id",
        trophyIds.map((t) => t.id)
      )
      .whereNotNull("steam_id")
      .delete();
  }

  // Revert display names to original
  await knex("Trophies")
    .where("name", "kanarating_top1")
    .update({ display_name: "{league} Kanarating #1" });
  await knex("Trophies")
    .where("name", "kanarating_top2")
    .update({ display_name: "{league} Kanarating #2" });
  await knex("Trophies")
    .where("name", "kanarating_top3")
    .update({ display_name: "{league} Kanarating #3" });
}
