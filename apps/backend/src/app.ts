import dotenv from "dotenv";

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined");
}

// Update with your config settings.
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  // eslint-disable-next-line no-console
  console.log("Loading .env.development & .env file");
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.development" });
}

if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("No JWT_SECRET or JWT_REFRESH_SECRET found in env");
  }
  if (
    !process.env.DB_HOST ||
    !process.env.DB_PORT ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME
  ) {
    throw new Error(
      "No DB_HOST, DB_PORT, DB_USER, DB_PASSWORD or DB_NAME found in env"
    );
  }
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "./configs/passport";

import "express-async-errors";

import v1Router from "./routes";
import { expressErrorHandler } from "./middlewares/express-error-handler";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

const frontendUrlEnv = process.env.FRONTEND_URL;

if (!frontendUrlEnv) {
  throw new Error("FRONTEND_URL is not defined");
}

const frontendUrl = new URL(frontendUrlEnv);
const frontendUrlOrigin = `${frontendUrl.protocol}//${frontendUrl.host}`;
const allowList = [frontendUrlOrigin];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
} satisfies cors.CorsOptions;

app.use(cors(corsOptions));

app.use(express.json());

app.use(helmet());
app.use(morgan("dev"));
app.use(passport.initialize());

app.use("/api/v1", v1Router);

app.use(expressErrorHandler);

export { app };
