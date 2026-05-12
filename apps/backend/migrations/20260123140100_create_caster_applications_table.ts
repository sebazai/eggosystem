import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("CasterApplications", (table) => {
    table.increments("id").primary().unsigned();
    table
      .integer("organizer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Organizers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("account_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.string("caster_url", 512).nullable();
    table
      .boolean("approved_terms_and_conditions")
      .notNullable()
      .defaultTo(false);
    table
      .integer("approved_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table.timestamp("approved_at").nullable();
    table
      .integer("rejected_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table.timestamp("rejected_at").nullable();
    table.text("rejection_reason").nullable();
    table.timestamps(true, true);
    table.unique(["account_id", "organizer_id"]);
    table.index(["organizer_id"]);
    table.index(["account_id"]);
    table.index(["approved_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("CasterApplications");
}
