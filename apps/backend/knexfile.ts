import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST ?? "eggo-devdb",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 6666,
      user: process.env.DB_USER ?? "kanadbuser",
      password: process.env.DB_PASSWORD ?? "dev-pass",
      database: process.env.DB_NAME ?? "kanaliiga",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeCast: (field: any, next: any): any => {
        if (field.type === "DATETIME") return field.string();
        return next();
      }
    },
    migrations: {
      directory: "./migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./seeds",
      extension: "ts"
    }
  },
  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeCast: (field: any, next: any): any => {
        if (field.type === "DATETIME") return field.string();
        return next();
      }
    },
    migrations: {
      directory: "./migrations",
      extension: "js"
    }
  }
};

export = config;
