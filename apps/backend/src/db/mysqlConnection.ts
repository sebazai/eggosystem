import { createPool } from "mysql2/promise";
import { dbEnvConfig } from "../configs/db-env";

const dbPool = createPool({
  ...dbEnvConfig,
  connectionLimit: 10, // Adjust based on load
  dateStrings: true,
  decimalNumbers: true
});

export const getConnection = () => {
  return dbPool.getConnection();
};

export const endDbConnection = async () => {
  return dbPool.end();
};
