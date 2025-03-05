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

declare module "jsonwebtoken" {
  export interface JwtPayload {
    steamId: string;
    displayName: string;
  }
}

const app = express();

app.use(cookieParser());

const frontendUrl = process.env.FRONTEND_URL;
const allowList = [frontendUrl];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (allowList.includes(origin) || !origin) {
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

app.use("/api/v1", v1Router);

app.use(errorHandler);

export { app };
