import { app } from "./src/app";
import { logger } from "./src/utils/app-logger";

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  logger.info(`Server started at ${process.env.BACKEND_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
