import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    // Winner (CT or T)
    table.specificType("winner", "CHAR(2)").nullable();
    // Round type (e.g. "full-buy", "CT:eco-T:eco")
    table.string("round_type", 64).nullable();

    // Avg bank per player (max 16k) -> SMALLINT UNSIGNED
    table.smallint("ct_avg_bank").unsigned().nullable();
    table.smallint("t_avg_bank").unsigned().nullable();

    // Total bank / equipment (5*16k = 80k possible) -> MEDIUMINT UNSIGNED
    table.mediumint("ct_total_bank").unsigned().nullable();
    table.mediumint("t_total_bank").unsigned().nullable();
    table.mediumint("ct_pre_buy_eq_value").unsigned().nullable();
    table.mediumint("t_pre_buy_eq_value").unsigned().nullable();
    table.mediumint("ct_end_bank").unsigned().nullable();
    table.mediumint("t_end_bank").unsigned().nullable();
    table.mediumint("ct_end_eq_value").unsigned().nullable();
    table.mediumint("t_end_eq_value").unsigned().nullable();

    // Buy strategy (e.g. "normal", "force", "pistol")
    table.string("ct_buy_strategy", 32).nullable();
    table.string("t_buy_strategy", 32).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    table.dropColumn("winner");
    table.dropColumn("round_type");
    table.dropColumn("ct_avg_bank");
    table.dropColumn("t_avg_bank");
    table.dropColumn("ct_total_bank");
    table.dropColumn("t_total_bank");
    table.dropColumn("ct_pre_buy_eq_value");
    table.dropColumn("t_pre_buy_eq_value");
    table.dropColumn("ct_end_bank");
    table.dropColumn("t_end_bank");
    table.dropColumn("ct_end_eq_value");
    table.dropColumn("t_end_eq_value");
    table.dropColumn("ct_buy_strategy");
    table.dropColumn("t_buy_strategy");
  });
}
