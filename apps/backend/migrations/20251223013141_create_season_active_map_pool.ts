import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    "SeasonActiveMapPool",
    (table: Knex.TableBuilder) => {
      table.integer("season_id").unsigned().notNullable();
      table.specificType("map_id", "TINYINT UNSIGNED").notNullable();
      table.primary(["season_id", "map_id"]);
      table
        .foreign("season_id")
        .references("id")
        .inTable("Seasons")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("map_id")
        .references("id")
        .inTable("Maps")
        .onUpdate("CASCADE")
        .onDelete("RESTRICT");
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("SeasonActiveMapPool");
}
