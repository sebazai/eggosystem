import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("MapRoundStats", function (table) {
    table
      .enu(
        "round_end_reason_info",
        [
          "bomb_defused", // 1
          "target_bombed", // 2
          "target_saved", // 3
          "t_win", // 4
          "ct_win" // 5
        ],
        {
          useNative: true,
          enumName: "round_end_reason_enum"
        }
      )
      .notNullable()
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("MapRoundStats", function (table) {
    table.tinyint("round_end_reason_info").notNullable().alter();
  });
}
