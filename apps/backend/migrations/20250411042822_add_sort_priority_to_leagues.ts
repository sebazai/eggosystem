import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Leagues", function (table) {
    table.integer("sort_priority").notNullable().defaultTo(99);
  });

  await knex("Leagues")
    .update({ sort_priority: 1 })
    .whereIn("name", ["Masters", "Pro"]);

  await knex("Leagues")
    .update({ sort_priority: 2 })
    .whereIn("name", ["Challengers", "Semi-pro"]);

  await knex("Leagues")
    .update({ sort_priority: 3 })
    .whereIn("name", ["Prospects", "MKT", "div2"]);

  await knex("Leagues").update({ sort_priority: 4 }).where("name", "div3");

  await knex("Leagues").update({ sort_priority: 5 }).where("name", "div4");

  await knex("Leagues").update({ sort_priority: 6 }).where("name", "div5");

  await knex("Leagues").update({ sort_priority: 7 }).where("name", "div6");

  await knex("Leagues").update({ sort_priority: 8 }).where("name", "div7");

  await knex("Leagues").update({ sort_priority: 9 }).where("name", "div8");

  await knex("Leagues").update({ sort_priority: 10 }).where("name", "div9");

  await knex("Leagues").update({ sort_priority: 11 }).where("name", "div10");

  await knex("Leagues").update({ sort_priority: 12 }).where("name", "div11");

  await knex("Leagues")
    .update({ sort_priority: 99 })
    .where("name", "kanakahakka");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Leagues", function (table) {
    table.dropColumn("sort_priority");
  });
}
