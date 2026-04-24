export const envConfig = {
  VIEWER_API_URL:
    process.env.NEXT_PUBLIC_VIEWER_API_URL || "http://localhost:3002",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  CLIENT_API_URL:
    process.env.NEXT_PUBLIC_CLIENT_API_URL || "http://localhost:3001",
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "",
  IMAGE_SERVICE_URL:
    process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || "https://img.kanaliiga.fi"
};
