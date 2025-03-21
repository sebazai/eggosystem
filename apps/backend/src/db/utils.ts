/**
 * Filters out null and undefined values from an object and constructs
 * the necessary parts for an SQL insert statement. Assumes that the
 * object keys correspond to the database column names.
 * @param data - The object containing the data to be inserted into the database.
 * @returns - An object containing the columns, placeholders, and values for the SQL insert statement.
 */
export const buildInsertQueryParts = <T extends object>(data: T) => {
  const filteredEntries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined
  );

  const columns = filteredEntries.map(([key]) => key);
  const placeholders = columns.map(() => "?").join(", ");
  const values = filteredEntries.map(([, value]) => value);

  return { columns, placeholders, values };
};
