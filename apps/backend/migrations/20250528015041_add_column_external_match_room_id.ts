import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table.string("external_match_room_id").nullable();
  });
  await knex.raw(`
    UPDATE Matches m
    JOIN (
      SELECT 
        mg.match_id,
        REGEXP_SUBSTR(mg.demofile, '^1-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}') AS external_id
      FROM MatchGames mg
      WHERE mg.demofile REGEXP '^1-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-1-1\\.dem$'
    ) extracted
    ON m.id = extracted.match_id
    SET m.external_match_room_id = extracted.external_id;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table.dropColumn("external_match_room_id");
  });
}
