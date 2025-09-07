import express from "express";
import { expressErrorHandler } from "../middlewares/express-error-handler";
import { setupFrontendUrl } from "./environment-setup";

/**
 * Creates a test Express app with a router mounted at a specific path
 * Handles FRONTEND_URL setup automatically
 */
export function createExpressTestApp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any,
  mountPath: string = "/"
): { app: express.Application; cleanup: () => void } {
  // Set up FRONTEND_URL environment variable
  const cleanup = setupFrontendUrl();

  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  app.use(expressErrorHandler);

  return { app, cleanup };
}

/**
 * Creates a test Express app with multiple routers
 * Handles FRONTEND_URL setup automatically
 */
export function createExpressTestAppWithRouters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routers: Array<{ path: string; router: any }>
): { app: express.Application; cleanup: () => void } {
  // Set up FRONTEND_URL environment variable
  const cleanup = setupFrontendUrl();

  const app = express();
  app.use(express.json());
  routers.forEach(({ path, router }) => {
    app.use(path, router);
  });
  app.use(expressErrorHandler);

  return { app, cleanup };
}
