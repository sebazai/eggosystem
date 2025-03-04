import { createPool } from "mysql2/promise";
import { dbEnvConfig } from "../configs/db-env";

const newDbPool = createPool({
  ...dbEnvConfig,
  connectionLimit: 10, // Adjust based on load
  dateStrings: true
});

export const getConnection = () => {
  return newDbPool.getConnection();
};

export const endDbConnection = async () => {
  return newDbPool.end();
};
