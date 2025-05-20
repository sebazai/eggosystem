import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "UPDATE Teams SET org_approved = 1 WHERE organization_id IS NOT NULL;"
  );
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
