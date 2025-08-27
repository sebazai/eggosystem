import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Update retry_count from data JSON field
  await knex.raw(`
    UPDATE FaceitWebhooks 
    SET retry_count = JSON_EXTRACT(data, '$.retry_count')
    WHERE JSON_EXTRACT(data, '$.retry_count') IS NOT NULL
  `);

  // Update external_payload_id from payload.id in data JSON field
  await knex.raw(`
    UPDATE FaceitWebhooks 
    SET external_payload_id = JSON_UNQUOTE(JSON_EXTRACT(data, '$.payload.id'))
    WHERE JSON_EXTRACT(data, '$.payload.id') IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Reset retry_count to default value
  await knex.raw(`
    UPDATE FaceitWebhooks 
    SET retry_count = 0
  `);

  // Note: We cannot reliably restore external_payload_id to its previous state
  // as we don't know what the original values were before this migration
}
