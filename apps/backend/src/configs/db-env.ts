import type knex from "knex";

export const dbEnvConfig = {
  host: process.env.DB_HOST ?? "eggo-devdb",
  port: parseInt(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER ?? "kanadbuser",
  password: process.env.DB_PASSWORD ?? "dev-pass",
  database: process.env.DB_NAME ?? "kanaliiga"
} satisfies
  | knex.Knex.StaticConnectionConfig
  | knex.Knex.ConnectionConfigProvider;
