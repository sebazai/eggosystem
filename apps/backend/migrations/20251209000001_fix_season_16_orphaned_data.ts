import { type Knex } from "knex";

export const config = { transaction: false };

/**
 * Migration to fix orphaned data in season 16:
 * 1. Create SeasonPlayerRanks for 2 orphaned SeasonTeamPlayers
 * 2. Update NULL rank data for 1 player
 * 3. Delete 4 orphaned manual ranks
 */
export async function up(knex: Knex): Promise<void> {
  console.log("Starting data cleanup migration for season 16...");

  // Check if season 16 exists - this migration is production-specific
  const seasonExists = await knex("Seasons").where({ id: 16 }).first();

  if (!seasonExists) {
    console.log(
      "Season 16 not found - skipping production-specific data cleanup migration"
    );
    return;
  }

  // 1. Fix player 76561198116385133 (has SeasonTeamPlayers but no SeasonPlayerRanks)
  // Only if the player exists in SteamPlayers
  const player1Exists = await knex("SteamPlayers")
    .where({ steam_id: "76561198116385133" })
    .first();
  if (player1Exists) {
    console.log("Creating SeasonPlayerRanks for player 76561198116385133...");
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
  } else {
    console.log(
      "Player 76561198116385133 not found in SteamPlayers - skipping"
    );
  }

  // 2. Fix player 76561199133774369 (has SeasonTeamPlayers but no SeasonPlayerRanks)
  const player2Exists = await knex("SteamPlayers")
    .where({ steam_id: "76561199133774369" })
    .first();
  if (player2Exists) {
    console.log("Creating SeasonPlayerRanks for player 76561199133774369...");
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
  } else {
    console.log(
      "Player 76561199133774369 not found in SteamPlayers - skipping"
    );
  }

  // 3. Update player 76561198128248609 (has SeasonPlayerRanks but with NULL cs2_rank)
  const player3Exists = await knex("SeasonPlayerRanks")
    .where({ steam_id: "76561198128248609", season_id: 16 })
    .first();

  if (player3Exists) {
    console.log("Updating SeasonPlayerRanks for player 76561198128248609...");
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
  } else {
    console.log(
      "Player 76561198128248609 not found in SeasonPlayerRanks - skipping"
    );
  }

  // 4. Delete orphaned manual ranks (SeasonPlayerRanks without SeasonTeamPlayers)
  console.log("Deleting orphaned manual ranks...");
  const orphanedManualRanks = [
    "76561198262659571",
    "76561197983184888",
    "76561198071674766",
    "76561199045305187"
  ];

  for (const steamId of orphanedManualRanks) {
    const deleted = await knex("SeasonPlayerRanks")
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

    if (deleted > 0) {
      console.log(`Deleted orphaned manual rank for ${steamId}`);
    }
  }

  console.log("Data cleanup migration completed successfully!");
}

export async function down(_knex: Knex): Promise<void> {
  console.log("Rolling back data cleanup migration...");

  // This migration is data-fixing, not schema-changing
  // Rollback would delete the fixed data, which is not desirable
  console.log(
    "Note: This migration fixes data integrity issues and cannot be safely rolled back."
  );
  console.log("Manual intervention required if rollback is needed.");
}
