import type { PoolConnection, RowDataPacket } from "mysql2/promise";
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
  trx?: PoolConnection
): Promise<T> => {
  const connection = trx ?? (await getConnection());

  try {
    const [rows] = await connection.query<dbQuery<T>>(query, queryParams);
    return rows;
  } finally {
    if (!trx) connection.release();
  }
};
