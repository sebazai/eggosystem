import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MarketingSponsors", (table) => {
    table.string("footer_image_phash", 64).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MarketingSponsors", (table) => {
    table.dropColumn("footer_image_phash");
  });
}
