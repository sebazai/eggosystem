export const envConfig = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  CLIENT_API_URL:
    process.env.NEXT_PUBLIC_CLIENT_API_URL ?? "http://localhost:3001",
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  API_KEY: process.env.NEXT_PUBLIC_API_KEY ?? "development_api_key"
};
