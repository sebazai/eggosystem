import dotenv from "dotenv";
import { logger } from "./utils/app-logger";

if (process.env.TEST_TYPE_ENV === "local-e2e") {
  logger.info("Loading .env.local.test file");
  dotenv.config({ path: ".env.local.test" });
}

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined");
}

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  logger.info("Loading .env.development & .env file");
  dotenv.config({ path: [".env", ".env.development"], quiet: true });
}

if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
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
import helmet from "helmet";
import morgan from "morgan";
import passport from "./configs/passport";

import v1Router from "./routes";
import { expressErrorHandler } from "./middlewares/express-error-handler";
import cookieParser from "cookie-parser";
import {
  initializeDiscordClient,
  setupDiscordEventHandlers
} from "./services/discord.services";
import cors from "cors";

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use(helmet());
app.use(morgan("dev"));
app.use(passport.initialize());

app.use("/api/v1", v1Router);

app.use(expressErrorHandler);

// Initialize Discord client if environment variables are available and not in test mode
if (
  process.env.DISCORD_BOT_TOKEN &&
  process.env.DISCORD_GUILD_ID &&
  process.env.NODE_ENV !== "test" &&
  process.env.NODE_ENV !== "e2e" &&
  process.env.TEST_TYPE !== "e2e"
) {
  initializeDiscordClient()
    .then(() => {
      logger.info("Discord client initialized successfully");
      return setupDiscordEventHandlers();
    })
    .catch((error) => {
      logger.error("Failed to initialize Discord client:", error);
    });
} else if (
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "e2e" ||
  process.env.TEST_TYPE === "e2e"
) {
  logger.info("Test environment detected, skipping Discord initialization");
} else {
  logger.info(
    "Discord environment variables not found, skipping Discord initialization"
  );
}

export { app };
