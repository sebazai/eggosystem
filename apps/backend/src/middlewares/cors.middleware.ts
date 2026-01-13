import cors from "cors";
import { logger } from "../utils/app-logger";

// Create a function that returns CORS options based on current environment
export const getCorsOptions = () => {
  const frontendUrlEnv = process.env.FRONTEND_URL;

  if (!frontendUrlEnv) {
    throw new Error("FRONTEND_URL is not defined");
  }

  const frontendUrl = new URL(frontendUrlEnv);
  const frontendUrlOrigin = `${frontendUrl.protocol}//${frontendUrl.host}`;
  const allowList = [frontendUrlOrigin];
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowList.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS rejection", {
          rejectedOrigin: origin,
          allowedOrigins: allowList,
          userAgent: "CORS Middleware"
        });
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true
  } satisfies cors.CorsOptions;
};

const frontendUrlEnv = process.env.FRONTEND_URL;
if (!frontendUrlEnv) {
  throw new Error("FRONTEND_URL is not defined");
}
const corsOptions = getCorsOptions();
export const corsMiddleware = cors(corsOptions);
