import Pyroscope, { type PyroscopeConfig } from "@pyroscope/nodejs";
import { logger } from "../utils/app-logger";

export function initializeProfiling() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_PROFILING === "true"
  ) {
    const pyroscopeServerAddress =
      process.env.OTEL_EXPORTER_OTLP_PROFILING_ENDPOINT;
    const pyroscopeAuthToken =
      process.env.OTEL_EXPORTER_OTLP_PROFILING_AUTH_TOKEN;
    const pyroscopeApplicationName =
      process.env.OTEL_SERVICE_NAME || "eggosystem-backend-1";

    if (!pyroscopeServerAddress) {
      logger.warn(
        "PYROSCOPE_SERVER_ADDRESS not configured, skipping profiling initialization"
      );
      return;
    }

    // Auth token is optional when using local Alloy
    const isLocalAlloy =
      pyroscopeServerAddress.includes("alloy") ||
      pyroscopeServerAddress.includes("localhost");

    if (!pyroscopeAuthToken && !isLocalAlloy) {
      logger.warn(
        "PYROSCOPE_AUTH_TOKEN not configured for remote server, skipping profiling initialization"
      );
      return;
    }

    try {
      const config = {
        serverAddress: pyroscopeServerAddress,
        appName: pyroscopeApplicationName,
        tags: {
          region:
            process.env.OTEL_EXPORTER_OTLP_PROFILING_REGION_TAG || "unknown",
          version:
            process.env.OTEL_EXPORTER_OTLP_PROFILING_VERSION_TAG || "unknown"
        },
        ...(pyroscopeAuthToken && { authToken: pyroscopeAuthToken })
      } satisfies PyroscopeConfig;

      Pyroscope.init(config);

      // Start profiling
      Pyroscope.start();

      logger.info(
        `✅ Profiling initialized for ${pyroscopeApplicationName} -> ${pyroscopeServerAddress}`
      );
    } catch (error) {
      console.error("❌ Failed to initialize profiling:", error);
    }
  } else {
    logger.info(
      "⚠️ Profiling disabled (production mode or ENABLE_PROFILING not set)"
    );
  }
}
