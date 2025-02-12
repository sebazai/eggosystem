import mysql from 'mysql2/promise';
import { envConfig } from '../configs/env';

const newDbPool = mysql.createPool({
  ...envConfig,
  connectionLimit: 10, // Adjust based on load
  dateStrings: true,
});

export const getConnection = () => {
  return newDbPool.getConnection();
};

export const endDbConnection = async () => {
  return newDbPool.end();
};
