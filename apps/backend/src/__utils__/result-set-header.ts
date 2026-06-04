import type { ResultSetHeader } from "mysql2/promise";

interface ResultSetHeaderFields {
  affectedRows: number;
  changedRows: number;
  fieldCount: number;
  insertId: number;
  info: string;
  serverStatus: number;
  warningStatus: number;
}

const defaultMockResultSetHeader: ResultSetHeaderFields = {
  affectedRows: 0,
  changedRows: 0,
  fieldCount: 0,
  insertId: 0,
  info: "",
  serverStatus: 0,
  warningStatus: 0
};

/** Jest/mock helper: mysql2 returns plain OkPacket objects at runtime. */
export function createMockResultSetHeader(
  overrides: Partial<ResultSetHeaderFields> = {}
): ResultSetHeader {
  const header: ResultSetHeaderFields = {
    ...defaultMockResultSetHeader,
    ...overrides
  };
  return header as ResultSetHeader;
}
