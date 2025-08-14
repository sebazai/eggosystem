import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  // Create KanahautomoRegistrations table
  await knex.schema.createTable(
    "KanahautomoRegistrations",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.bigInteger("steam_id").notNullable();
      table.integer("organization_id").unsigned().notNullable();
      table.boolean("accepted_terms").notNullable().defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Foreign key constraints
      table
        .foreign("steam_id")
        .references("steam_id")
        .inTable("SteamPlayers")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");

      table
        .foreign("organization_id")
        .references("id")
        .inTable("Organizations")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");

      // Add unique constraint here
      table.unique(["steam_id", "organization_id"]);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  // Drop table
  await knex.schema.dropTableIfExists("KanahautomoRegistrations");
}
