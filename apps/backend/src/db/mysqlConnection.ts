import { createPool } from "mysql2/promise";
import { dbEnvConfig } from "../configs/db-env";

const dbPool = createPool({
  ...dbEnvConfig,
  connectionLimit: 10, // Adjust based on load
  dateStrings: true,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  typeCast: function (field, next) {
    if (field.type === "TINY" && field.length === 1) {
      const value = field.string();
      return value === "1";
    }

    return next();
  }
});

export const getConnection = () => {
  return dbPool.getConnection();
};

export const endDbConnection = async () => {
  return dbPool.end();
};
