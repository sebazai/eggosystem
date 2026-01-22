import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Step 1: Add new timestamp columns as nullable
  await knex.schema.alterTable("Matches", (table) => {
    table.timestamp("start_timestamp").nullable();
    table.timestamp("end_timestamp").nullable();
  });

  // Step 2: Migrate existing data by combining match_date + start_time/end_time into UTC timestamps
  // Since existing data is already treated as UTC, we can directly concatenate
  // MySQL/MariaDB TIMESTAMP stores in UTC internally and will parse the datetime string
  await knex.raw(`
    UPDATE Matches
    SET start_timestamp = STR_TO_DATE(CONCAT(match_date, ' ', start_time), '%Y-%m-%d %H:%i:%s')
    WHERE start_timestamp IS NULL
  `);

  await knex.raw(`
    UPDATE Matches
    SET end_timestamp = STR_TO_DATE(CONCAT(match_date, ' ', end_time), '%Y-%m-%d %H:%i:%s')
    WHERE end_time IS NOT NULL AND end_timestamp IS NULL
  `);

  // Step 3: Set start_timestamp to NOT NULL after data migration
  await knex.schema.alterTable("Matches", (table) => {
    table.timestamp("start_timestamp").notNullable().alter();
  });

  // Step 4: Drop the old index that uses match_date
  await knex.raw(
    `DROP INDEX IF EXISTS idx_match_date_league_active ON Matches`
  );

  // Step 5: Drop the old columns
  await knex.schema.alterTable("Matches", (table) => {
    table.dropColumn("match_date");
    table.dropColumn("start_time");
    table.dropColumn("end_time");
  });

  // Step 6: Recreate the index using start_timestamp instead of match_date
  // Note: MariaDB doesn't support functional indexes (DATE() function), so we index
  // the timestamp column directly. This index will help with:
  // - ORDER BY start_timestamp DESC (most common use case)
  // - Range queries on start_timestamp
  // - Queries filtering by DATE(start_timestamp) can still benefit from this index
  await knex.raw(`
    CREATE INDEX idx_match_date_league_active 
    ON Matches(start_timestamp DESC, league_id, season_id, status)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Step 1: Drop the new index
  await knex.raw(
    `DROP INDEX IF EXISTS idx_match_date_league_active ON Matches`
  );

  // Step 2: Add back the old columns
  await knex.schema.alterTable("Matches", (table) => {
    table.date("match_date").notNullable();
    table.time("start_time").notNullable();
    table.time("end_time").nullable();
  });

  // Step 3: Migrate data back from timestamps to date/time
  // Extract date and time from timestamp (stored as UTC)
  await knex.raw(`
    UPDATE Matches
    SET match_date = DATE(start_timestamp),
        start_time = TIME(start_timestamp)
    WHERE start_timestamp IS NOT NULL
  `);

  await knex.raw(`
    UPDATE Matches
    SET end_time = TIME(end_timestamp)
    WHERE end_timestamp IS NOT NULL
  `);

  // Step 4: Recreate the old index
  await knex.raw(`
    CREATE INDEX idx_match_date_league_active 
    ON Matches(match_date DESC, league_id, season_id, status)
  `);

  // Step 5: Drop the new timestamp columns
  await knex.schema.alterTable("Matches", (table) => {
    table.dropColumn("start_timestamp");
    table.dropColumn("end_timestamp");
  });
}
