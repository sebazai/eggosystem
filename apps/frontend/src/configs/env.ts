export const envConfig = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  CLIENT_API_URL: process.env.NEXT_PUBLIC_CLIENT_API_URL,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? ""
};
