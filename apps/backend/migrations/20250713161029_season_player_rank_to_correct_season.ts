import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const latestSeasonsQuery = `
    SELECT 
      steam_id,
      MAX(season_id) as latest_season_id
    FROM SeasonTeamPlayers 
    GROUP BY steam_id
  `;

  const currentRanks = await knex.raw(`
    SELECT 
      spr.id,
      spr.steam_id,
      spr.season_id as current_season_id,
      COALESCE(latest.latest_season_id, spr.season_id) as target_season_id
    FROM SeasonPlayerRanks spr
    LEFT JOIN (${latestSeasonsQuery}) latest ON spr.steam_id = latest.steam_id
    WHERE spr.season_id != COALESCE(latest.latest_season_id, spr.season_id)
  `);

  for (const rank of currentRanks[0]) {
    const { id, steam_id, target_season_id } = rank;

    const existingRank = await knex("SeasonPlayerRanks")
      .where({ steam_id, season_id: target_season_id })
      .first();

    if (existingRank) {
      await knex("SeasonPlayerRanks").where({ id }).del();
    } else {
      await knex("SeasonPlayerRanks")
        .where({ id })
        .update({ season_id: target_season_id });
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Unreversible
}
