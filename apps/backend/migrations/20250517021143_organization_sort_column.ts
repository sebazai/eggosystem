import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.integer("sort_order").unsigned().nullable();
  });

  await knex("Organizations").where({ id: 5 }).update({ sort_order: 100000 });
  await knex("Organizations").where({ id: 29 }).update({ sort_order: 95000 });
  await knex("Organizations").where({ id: 39 }).update({ sort_order: 80000 });
  await knex("Organizations").where({ id: 10 }).update({ sort_order: 75000 });
  await knex("Organizations").where({ id: 108 }).update({ sort_order: 70000 });
  await knex("Organizations").where({ id: 158 }).update({ sort_order: 65000 });
  await knex("Organizations").where({ id: 101 }).update({ sort_order: 60000 });
  await knex("Organizations").where({ id: 160 }).update({ sort_order: 55000 });
  await knex("Organizations").where({ id: 132 }).update({ sort_order: 50000 });
  await knex("Organizations").where({ id: 165 }).update({ sort_order: 45000 });
  await knex("Organizations").where({ id: 236 }).update({ sort_order: 40000 });
  await knex("Organizations").where({ id: 17 }).update({ sort_order: 35000 });
  await knex("Organizations").where({ id: 45 }).update({ sort_order: 30000 });
  await knex("Organizations").where({ id: 53 }).update({ sort_order: 25000 });
  await knex("Organizations").where({ id: 85 }).update({ sort_order: 20000 });
  await knex("Organizations").where({ id: 14 }).update({ sort_order: 15000 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.dropColumn("sort_order");
  });
}
