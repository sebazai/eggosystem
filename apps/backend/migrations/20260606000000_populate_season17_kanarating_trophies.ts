import type { Knex } from "knex";

/**
 * Season 17 regular season kanarating top 3 trophy assignments per division.
 * Players ranked by average kana_rating (primary role, stage=1, >2 maps played).
 *
 * Uses the same DB-driven approach as 20251206000003_populate_mpk_trophies.ts
 * to avoid foreign key failures from steam IDs not present in SteamPlayers.
 */

const SEASON_ID = 17;

export async function up(knex: Knex): Promise<void> {
  const season = await knex("Seasons").where("id", SEASON_ID).first();
  if (!season) return;

  const trophies = await knex("Trophies")
    .select("id", "name", "placement")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  const trophyMap: Record<number, number> = {};
  for (const trophy of trophies) {
    trophyMap[trophy.placement] = trophy.id;
  }

  const seasonLeagues = await knex.raw(
    `
    SELECT DISTINCT m.season_id, m.league_id
    FROM Matches m
    WHERE m.season_id = ?
      AND m.stage = 1
      AND m.league_id IS NOT NULL
    ORDER BY m.league_id
  `,
    [SEASON_ID]
  );

  for (const sl of seasonLeagues[0]) {
    const { season_id, league_id } = sl;

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

    const players = topPlayers[0];
    for (let i = 0; i < players.length; i++) {
      const placement = i + 1;
      const trophyId = trophyMap[placement];
      if (!trophyId) continue;

      const player = players[i];

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
  const trophyIds = await knex("Trophies")
    .select("id")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  if (trophyIds.length > 0) {
    await knex("TrophyAssignments")
      .whereIn(
        "trophy_id",
        trophyIds.map((t) => t.id)
      )
      .where("season_id", SEASON_ID)
      .whereNotNull("steam_id")
      .delete();
  }
}
