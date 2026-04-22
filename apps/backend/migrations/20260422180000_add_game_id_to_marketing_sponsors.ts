import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MarketingSponsors", (table) => {
    table
      .integer("game_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Games")
      .onDelete("RESTRICT");
    table.index(
      ["tier", "game_id", "display_order"],
      "idx_marketing_sponsors_tier_game_order"
    );
  });

  await knex.raw(`
    UPDATE MarketingSponsors
    SET game_id = 1
    WHERE tier = 'game_wide' AND game_id IS NULL
  `);

  await knex.raw(`
    ALTER TABLE MarketingSponsors
    ADD CONSTRAINT marketing_sponsors_game_scope_chk
    CHECK (
      (tier = 'game_wide' AND game_id IS NOT NULL)
      OR (tier <> 'game_wide' AND game_id IS NULL)
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE MarketingSponsors DROP CONSTRAINT marketing_sponsors_game_scope_chk"
  );
  await knex.schema.alterTable("MarketingSponsors", (table) => {
    table.dropIndex(
      ["tier", "game_id", "display_order"],
      "idx_marketing_sponsors_tier_game_order"
    );
    table.dropColumn("game_id");
  });
}
