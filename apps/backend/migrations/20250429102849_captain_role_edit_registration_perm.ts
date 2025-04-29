import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("Roles").insert({
    id: 1,
    role_name: "captain"
  });
  await knex("Permissions").insert({
    id: 1,
    permission_name: "edit-registration"
  });
  await knex("RolePermissions").insert({
    role_id: 1,
    permission_id: 1
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DELETE FROM Roles WHERE id = ?", [1]);
  await knex.raw("DELETE FROM Permissions WHERE id = ?", [1]);
  await knex.raw(
    "DELETE FROM RolePermissions WHERE role_id = ? AND permission_id = ?",
    [1, 1]
  );
}
