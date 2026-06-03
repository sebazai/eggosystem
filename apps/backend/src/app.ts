import { logger } from "./utils/app-logger";
import { initializeProfiling } from "./configs/profiling";

if (process.env.NODE_ENV === "e2e") {
  logger.info("Loading .env.local.test file");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dotenv is a devDependency; only loaded in non-production paths
  require("dotenv").config({ path: ".env.local.test" });
}

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined");
}

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  logger.info("Loading .env.development & .env file");
  // Load .env.development first so it takes precedence over .env
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dotenv is a devDependency; only loaded in non-production paths
  require("dotenv").config({ path: [".env.development", ".env"], quiet: true });
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

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined");
}

if (process.env.NODE_ENV === "production") {
  void initializeProfiling();
}

import express from "express";
import { EventEmitter } from "node:events";
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
import { queueConsumerManager } from "./services/queue-consumer-manager";
import cors from "cors";

/**
 * Express and middleware (morgan, helmet, audit logging, etc.) attach several
 * `finish` listeners per {@link import("http").ServerResponse}. The default cap
 * of 10 triggers MaxListenersExceededWarning under normal operation.
 */
EventEmitter.defaultMaxListeners = 32;

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
// Increase JSON body size limit to 10MB for image uploads
app.use(express.json({ limit: "10mb" }));

app.use(helmet());
app.use(
  morgan("dev", {
    skip: (req, _res) => {
      return req.baseUrl === "/api/v1/health";
    }
  })
);
app.use(passport.initialize());

app.use("/api/v1", v1Router);

app.use(expressErrorHandler);

// Initialize Discord client if environment variables are available and not in test mode
// Note: Server will start even if Discord initialization fails
if (
  process.env.DISCORD_BOT_TOKEN &&
  process.env.DISCORD_GUILD_ID &&
  process.env.NODE_ENV !== "test" &&
  process.env.NODE_ENV !== "e2e"
) {
  initializeDiscordClient()
    .then(() => {
      logger.info("Discord client initialized successfully");
      return setupDiscordEventHandlers();
    })
    .catch((error) => {
      logger.error(
        "Failed to initialize Discord client after retries. Server will continue without Discord integration.",
        error
      );
      logger.warn(
        "Discord features will be unavailable. Reconnection will be attempted on next request."
      );
    });
} else if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e") {
  logger.info("Test environment detected, skipping Discord initialization");
} else {
  logger.info(
    "Discord environment variables not found, skipping Discord initialization"
  );
}

// Initialize queue consumers if not in test mode and RabbitMQ environment variables are available
// Note: Server will start even if RabbitMQ initialization fails - automatic reconnection will be attempted
if (
  process.env.NODE_ENV !== "test" &&
  process.env.NODE_ENV !== "e2e" &&
  process.env.RABBITMQ_HOST &&
  process.env.RABBITMQ_USER &&
  process.env.RABBITMQ_PASSWORD
) {
  queueConsumerManager
    .startAllConsumers()
    .then(() => {
      logger.info("Queue consumers initialized successfully");
    })
    .catch(() => {
      // Error is already logged in startAllConsumers with retry details
      logger.warn(
        "Queue consumers initialization completed with errors. Server will continue. Automatic reconnection will be attempted."
      );
    });
} else if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e") {
  logger.info(
    "Test environment detected, skipping queue consumer initialization"
  );
} else {
  logger.info(
    "RabbitMQ environment variables not found, skipping queue consumer initialization"
  );
}

export { app };
