import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // No-op migration - this table creation was removed in favor of using existing Reservations table
  // This migration file exists only to maintain database migration integrity
}

export async function down(knex: Knex): Promise<void> {
  // No-op migration - nothing to roll back
}
