/* eslint-disable @typescript-eslint/no-require-imports */
import type { Knex } from "knex";
import { envConnection } from "./helpers/migrationsDbConnections";
import * as fs from "fs";

// This will only run if dbdump/kanaclean.sql exists, used only to import old data
export async function up(): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
      user: process.env.DB_ROOT_USER ?? "root",
      password: process.env.DB_ROOT_PASSWORD ?? "dev-pass",
    },
  };

  // if dbdump/kanaclean.sql exists
  // read it and execute it
  const fileExists = fs.existsSync("./dbdump/kanaclean.sql");
  const knex = require("knex");
  // Create a temporary connection without specifying a database
  const tempDb = knex(baseDbConfig);

  try {
    console.log("Checking if 'kana' database exists...");
    // Check if the 'kana' database exists
    const [rows] = await tempDb.raw("SHOW DATABASES LIKE 'kana';");

    if (rows.length === 0 && fileExists) {
      console.log("Database 'kana' does not exist. Creating it...");
      await tempDb.raw("CREATE DATABASE kana;");
      await tempDb.raw("GRANT ALL PRIVILEGES ON kana.* TO 'kanadbuser'@'%';");
      await tempDb.raw("FLUSH PRIVILEGES;");
    }

    console.log("Database 'kana' exists. Proceeding with migration.");
  } finally {
    await tempDb.destroy(); // Close temporary connection
  }

  const oldKanaDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
      database: "kana",
    },
  };

  const otherDb = require("knex")(oldKanaDbConfig);

  try {
    if (fileExists) {
      console.log("Migrating old Kana table from kanaclean.sql...");
      const { exec } = require("child_process");
      const { promisify } = require("util");

      const execPromise = promisify(exec);

      const command = `mysql -h ${process.env.DB_HOST ?? "localhost"} -P ${
        process.env.DB_PORT ?? "6666"
      } -u ${process.env.DB_ROOT_USER ?? "root"} -p${
        process.env.DB_ROOT_PASSWORD ?? "dev-pass"
      } kana < ./dbdump/kanaclean.sql`;

      try {
        const { stdout, stderr } = await execPromise(command); // Await the exec command
        console.log(stdout); // Output of the command
        if (stderr) {
          console.error(`Stderr: ${stderr}`); // If there are errors in stderr
        }
        console.log("SQL file imported successfully");
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    }

    console.log("Cleaning up the old Kana database...");
    // Read and execute SQL file
    if (fileExists) {
      const sql = fs.readFileSync("./dbdump/clean_rows_kanaclean.sql", "utf8");
      const statements = sql.split(";").filter((stmt) => stmt.trim());

      for (const statement of statements) {
        console.log("Executing:", statement);
        await otherDb.raw(statement);
      }
    }
  } finally {
    await otherDb.destroy(); // Ensure database connection is closed
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop table kana if exists
  return knex.raw("DROP DATABASE IF EXISTS kana;");
}
