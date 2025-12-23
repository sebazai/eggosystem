import { type Knex } from "knex";

export const config = { transaction: false };

/**
 * Migration to fix orphaned data in season 16:
 * 1. Create SeasonPlayerRanks for 2 orphaned SeasonTeamPlayers
 * 2. Update NULL rank data for 1 player
 * 3. Delete 4 orphaned manual ranks
 */
export async function up(knex: Knex): Promise<void> {
  // Check if season 16 exists - this migration is production-specific
  const seasonExists = await knex("Seasons").where({ id: 16 }).first();

  if (!seasonExists) {
    return;
  }

  // 1. Fix player 76561198116385133 (has SeasonTeamPlayers but no SeasonPlayerRanks)
  // Only if the player exists in SteamPlayers
  const player1Exists = await knex("SteamPlayers")
    .where({ steam_id: "76561198116385133" })
    .first();
  if (player1Exists) {
    await knex.raw(`
      INSERT INTO SeasonPlayerRanks (
        steam_id,
        season_id,
        cs2_rank,
        cs_hours,
        faceit_level,
        faceit_elo,
        faceit_kd,
        faceit_date,
        kana_elo,
        rank_updated_at,
        hours_updated_at
      ) VALUES (
        '76561198116385133',
        16,
        14533,
        5346,
        8,
        1534,
        1.02,
        FROM_UNIXTIME(1764153505905 / 1000),
        229,
        '2025-11-13 17:48:07',
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        cs2_rank = VALUES(cs2_rank),
        cs_hours = VALUES(cs_hours),
        faceit_level = VALUES(faceit_level),
        faceit_elo = VALUES(faceit_elo),
        faceit_kd = VALUES(faceit_kd),
        faceit_date = VALUES(faceit_date),
        kana_elo = VALUES(kana_elo),
        rank_updated_at = VALUES(rank_updated_at),
        hours_updated_at = VALUES(hours_updated_at)
    `);
  }

  // 2. Fix player 76561199133774369 (has SeasonTeamPlayers but no SeasonPlayerRanks)
  const player2Exists = await knex("SteamPlayers")
    .where({ steam_id: "76561199133774369" })
    .first();
  if (player2Exists) {
    await knex.raw(`
      INSERT INTO SeasonPlayerRanks (
        steam_id,
        season_id,
        cs2_rank,
        cs_hours,
        faceit_level,
        faceit_elo,
        faceit_kd,
        faceit_date,
        kana_elo,
        rank_updated_at,
        hours_updated_at
      ) VALUES (
        '76561199133774369',
        16,
        18001,
        NULL,
        9,
        2000,
        1.3,
        FROM_UNIXTIME(1764761420778 / 1000),
        261,
        NULL,
        NULL
      )
      ON DUPLICATE KEY UPDATE
        cs2_rank = VALUES(cs2_rank),
        faceit_level = VALUES(faceit_level),
        faceit_elo = VALUES(faceit_elo),
        faceit_kd = VALUES(faceit_kd),
        faceit_date = VALUES(faceit_date),
        kana_elo = VALUES(kana_elo)
    `);
  }

  // 3. Update player 76561198128248609 (has SeasonPlayerRanks but with NULL cs2_rank)
  const player3Exists = await knex("SeasonPlayerRanks")
    .where({ steam_id: "76561198128248609", season_id: 16 })
    .first();

  if (player3Exists) {
    await knex.raw(`
      UPDATE SeasonPlayerRanks
      SET
        cs2_rank = 18072,
        faceit_level = 8,
        faceit_elo = 1653,
        faceit_kd = 1.24,
        faceit_date = FROM_UNIXTIME(1765291579413 / 1000),
        kana_elo = 247,
        rank_updated_at = '2025-09-04 00:00:00'
      WHERE steam_id = '76561198128248609' AND season_id = 16
    `);
  }

  // 4. Delete orphaned manual ranks (SeasonPlayerRanks without SeasonTeamPlayers)

  const orphanedManualRanks = [
    "76561198262659571",
    "76561197983184888",
    "76561198071674766",
    "76561199045305187"
  ];

  for (const steamId of orphanedManualRanks) {
    await knex("SeasonPlayerRanks")
      .where({ steam_id: steamId, season_id: 16 })
      .whereNotExists(function () {
        this.select("*")
          .from("SeasonTeamPlayers")
          .whereRaw("SeasonTeamPlayers.steam_id = SeasonPlayerRanks.steam_id")
          .whereRaw(
            "SeasonTeamPlayers.season_id = SeasonPlayerRanks.season_id"
          );
      })
      .delete();
  }
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
