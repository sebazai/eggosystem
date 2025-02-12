/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise";

import type { RowDataPacket } from "mysql2/promise";

export const envConnection = {
  host: process.env.DB_HOST ?? "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 6666,
  user: process.env.DB_USER ?? "kanadbuser",
  password: process.env.DB_PASSWORD ?? "dev-pass",
};

type dbDefaults = RowDataPacket[] | RowDataPacket[][];
type dbQuery<T> = T & dbDefaults;

const oldDbPool = mysql.createPool({
  ...envConnection,
  database: "kana",
  connectionLimit: 10, // Adjust based on load
  dateStrings: true,
});

const newDbPool = mysql.createPool({
  ...envConnection,
  database: process.env.DB_NAME ?? "kanaliiga",
  connectionLimit: 10, // Adjust based on load
  dateStrings: true,
});

export const runOldDbQuery = async <T>(
  query: string,
  queryParams: any[] = [],
): Promise<T[]> => {
  const connection = await oldDbPool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<dbQuery<T[]>>(query, queryParams);
    await connection.commit();
    return rows;
  } catch (error) {
    console.error("Database Error:", error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const runNewDbQuery = async <T>(
  query: string,
  queryParams: any[] = [],
): Promise<T> => {
  const connection = await newDbPool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<dbQuery<T>>(query, queryParams);
    await connection.commit();
    return rows;
  } catch (error) {
    console.error("Database Error:", error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
