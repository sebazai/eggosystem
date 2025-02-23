/* eslint-disable @typescript-eslint/no-namespace */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";

import v1Router from "./routes";
import { errorHandler } from "./middlewares/errors";
import { ParsedParams } from "@eggosystem/types";

declare global {
  namespace Express {
    interface Request {
      parsedParams: ParsedParams; // Add the parsedParams property to the Request type
    }
  }
}

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/v1", v1Router);

app.use(errorHandler);

export { app };
