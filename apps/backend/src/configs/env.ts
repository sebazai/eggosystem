import { config } from "dotenv";
import * as fs from "fs";

// Update with your config settings.
if (fs.existsSync(`.env.${process.env.NODE_ENV}`)) {
  config({ path: `.env.${process.env.NODE_ENV}` });
}

export const envConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: parseInt(process.env.DB_PORT ?? "6666"),
  user: process.env.DB_USER ?? "kanadbuser",
  password: process.env.DB_PASSWORD ?? "dev-pass",
  database: process.env.DB_NAME ?? "kanaliiga"
};
