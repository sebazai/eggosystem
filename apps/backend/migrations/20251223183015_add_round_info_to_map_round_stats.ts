import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    // Buy type columns (pistol, eco, force, full, etc.)
    table.string("ct_buy_type", 20).nullable();
    table.string("t_buy_type", 20).nullable();

    // Pre-buy bank (money before buying)
    table.integer("ct_pre_buy_bank").unsigned().nullable();
    table.integer("t_pre_buy_bank").unsigned().nullable();

    // Equipment value at start of round
    table.integer("ct_equipment_value").unsigned().nullable();
    table.integer("t_equipment_value").unsigned().nullable();

    // Round importance score
    table.decimal("importance", 4, 2).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    table.dropColumn("ct_buy_type");
    table.dropColumn("t_buy_type");
    table.dropColumn("ct_pre_buy_bank");
    table.dropColumn("t_pre_buy_bank");
    table.dropColumn("ct_equipment_value");
    table.dropColumn("t_equipment_value");
    table.dropColumn("importance");
  });
}
