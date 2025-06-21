import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  // Create KanahautomoRegistration table
  await knex.schema.createTable(
    "KanahautomoRegistration",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.bigInteger("steam_id").notNullable();
      table.integer("organization_id").unsigned().notNullable();
      table
        .enum("status", ["active", "team_formed"])
        .notNullable()
        .defaultTo("active");
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

      // Unique constraint: one player can only be registered once
      table.unique(["steam_id"]);

      // Index for performance
      table.index(["organization_id", "status"]);
    }
  );

  // Create trigger to detect when 5+ players are ready to form a team
  await knex.raw(`
    CREATE TRIGGER kanahautomo_team_ready_trigger
    AFTER INSERT ON KanahautomoRegistration
    FOR EACH ROW
    BEGIN
      DECLARE player_count INT;
      
      -- Count active players in the same organization
      SELECT COUNT(*) INTO player_count
      FROM KanahautomoRegistration
      WHERE organization_id = NEW.organization_id 
        AND status = 'active';
      
      -- If we have 5 or more players, we could create a Discord channel
      -- This is a placeholder for future Discord integration
      -- For now, we just log that a team is ready to form
      IF player_count >= 5 THEN
        -- Future: Create Discord channel and add players
        -- Future: Send notification to organization admin
        INSERT INTO AuditLog (action_type, entity_type, entity_id, metadata)
        VALUES ('team_ready', 'KanahautomoRegistration', NEW.organization_id, 
                JSON_OBJECT('player_count', player_count, 'organization_id', NEW.organization_id));
      END IF;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw("DROP TRIGGER IF EXISTS kanahautomo_team_ready_trigger");

  // Drop table
  await knex.schema.dropTableIfExists("KanahautomoRegistration");
}
