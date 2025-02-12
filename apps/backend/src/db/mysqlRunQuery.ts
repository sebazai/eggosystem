import type { RowDataPacket } from "mysql2/promise";
import { getConnection } from "./mysqlConnection";

type QueryParam =
  | string
  | number
  | boolean
  | null
  | Date
  | Buffer
  | QueryParam[]; // Allow nested arrays for `IN (?)`
type QueryParams = QueryParam[];

type dbDefaults = RowDataPacket[] | RowDataPacket[][];
type dbQuery<T> = T & dbDefaults;

export const runQuery = async <T>(
  query: string,
  queryParams: QueryParams = [],
): Promise<T> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<dbQuery<T>>(query, queryParams);
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
