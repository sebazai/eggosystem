import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Get existing enum values
  const result = await knex.raw(`
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Matches' 
    AND COLUMN_NAME = 'status'
  `);

  const enumValues = result[0][0].COLUMN_TYPE.replace(/^enum\(|\)$/g, "")
    .split(",")
    .map((val: string) => val.replace(/^'|'$/g, ""));

  // Add new value
  const newEnumValues = [...enumValues, "PAUSED"];

  await knex.raw(`
    ALTER TABLE Matches 
    MODIFY COLUMN status ENUM(${newEnumValues.map((v) => `'${v}'`).join(",")}) 
    NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Get existing enum values
  const result = await knex.raw(`
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Matches' 
    AND COLUMN_NAME = 'status'
  `);

  const enumValues: string[] = result[0][0].COLUMN_TYPE.replace(
    /^enum\(|\)$/g,
    ""
  )
    .split(",")
    .map((val: string) => val.replace(/^'|'$/g, ""));

  // Remove PAUSED value
  const newEnumValues = enumValues.filter((val: string) => val !== "PAUSED");

  await knex.raw(`
    ALTER TABLE Matches 
    MODIFY COLUMN status ENUM(${newEnumValues.map((v) => `'${v}'`).join(",")}) 
    NOT NULL
  `);
}
