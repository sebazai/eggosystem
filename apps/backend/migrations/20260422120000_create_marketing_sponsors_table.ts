import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("MarketingSponsors", (table) => {
    table.increments("id").primary().unsigned();
    table.string("tier", 40).notNullable();
    table.string("display_name", 255).notNullable();
    table.text("external_url").nullable();
    table.integer("display_order").unsigned().notNullable().defaultTo(0);
    table.string("image_phash", 64).nullable();
    table.boolean("enabled").notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(["tier", "display_order", "id"]);
    table.index(["tier", "enabled"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("MarketingSponsors");
}
