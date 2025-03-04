/* eslint-disable @typescript-eslint/no-namespace */
import dotenv from "dotenv";
import * as fs from "fs";

// Update with your config settings.
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env" });
  if (fs.existsSync(`.env.development`)) {
    dotenv.config({ path: `.env.development` });
  }
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "express-async-errors";

import v1Router from "./routes";
import { errorHandler } from "./middlewares/errors";
import { ParsedParams } from "@eggosystem/types";
import cookieParser from "cookie-parser";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      parsedParams: ParsedParams; // Add the parsedParams property to the Request type
      auth?: JwtPayload;
    }
  }
}

const app = express();

const allowedOrigins = [
  "http://localhost:3000" // Next.js frontend URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(morgan("dev"));

app.use("/api/v1", v1Router);

app.use(errorHandler);

export { app };
