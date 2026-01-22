import { createPool, type PoolOptions } from "mysql2/promise";
import { dbEnvConfig } from "../configs/db-env";

const dbPool = createPool({
  ...dbEnvConfig,
  connectionLimit: 250,
  queueLimit: 500,
  idleTimeout: 20000,
  // debug: process.env.NODE_ENV !== "production",
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  typeCast: function (field, next) {
    // Convert TINYINT(1) to boolean
    if (field.type === "TINY" && field.length === 1) {
      const value = field.string();
      return value === "1";
    }

    // Convert DATE fields to strings (YYYY-MM-DD format)
    // TIMESTAMP and DATETIME fields remain as Date objects (handled by next())
    // This ensures DATE fields (date-only, no time) are returned as strings,
    // while TIMESTAMP/DATETIME fields are returned as Date objects for proper UTC handling
    // field.type is a string (e.g., "DATE", "DATETIME", "TIMESTAMP")
    if (field.type === "DATE") {
      return field.string();
    }
    return next();
  }
} satisfies PoolOptions);

export const getConnection = () => {
  return dbPool.getConnection();
};

export const endDbConnection = async () => {
  return dbPool.end();
};
