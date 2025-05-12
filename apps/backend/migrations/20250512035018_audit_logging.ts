import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("AuditLog", (table) => {
    table.bigIncrements("id").primary();

    table.string("action_type").notNullable(); // e.g., 'Read User', 'Delete Account'
    table.string("entity_type").notNullable(); // e.g., 'Account', 'Match'
    table.bigInteger("entity_id").nullable(); // What was acted on

    table
      .integer("user_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL"); // If user is deleted, keep audit

    table.json("request_data").nullable(); // From req.body
    table.json("response_data").nullable(); // From res.json()

    table.integer("response_status").notNullable();
    table.string("response_message").nullable();

    table.text("user_agent").nullable();

    table.json("metadata").nullable(); // Additional info

    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["entity_type", "entity_id"]);
    table.index(["user_id"]);
    table.index(["created_at"]);
  });

  // Requires root
  // Enable event scheduler (only needs to be done once at DB level)
  // await knex.raw(`SET GLOBAL event_scheduler = ON`);

  // Create the event to delete logs older than 1 year
  await knex.raw(`
    CREATE EVENT IF NOT EXISTS delete_old_audit_logs
    ON SCHEDULE EVERY 1 DAY
    DO
      DELETE FROM AuditLog WHERE created_at < NOW() - INTERVAL 1 YEAR
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("AuditLog");
  await knex.raw(`DROP EVENT IF EXISTS delete_old_audit_logs`);
}
