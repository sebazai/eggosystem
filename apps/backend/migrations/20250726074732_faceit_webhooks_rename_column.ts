import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.renameColumn("external_match_room_id", "external_payload_id");
    // convert data and details to json
    table.json("data").alter();
    table.json("details").alter();
  });
  await knex.raw(`
      UPDATE FaceitWebhooks
      SET
        data = JSON_UNQUOTE(data),
        details = JSON_UNQUOTE(details);
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.renameColumn("external_payload_id", "external_match_room_id");
    table.text("data").alter();
    table.text("details").alter();
  });
  await knex.raw(`
      UPDATE FaceitWebhooks
      SET
        data = JSON_QUOTE(data),
        details = JSON_QUOTE(details);
    `);
}
