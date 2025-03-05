export const dbEnvConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: parseInt(process.env.DB_PORT ?? "6666"),
  user: process.env.DB_USER ?? "kanadbuser",
  password: process.env.DB_PASSWORD ?? "dev-pass",
  database: process.env.DB_NAME ?? "kanaliiga"
};
