import { createPool, type PoolOptions } from "mysql2/promise";
import { dbEnvConfig } from "../configs/db-env";
import { logger } from "../utils/app-logger";

const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT ?? "100", 10);

const dbPool = createPool({
  ...dbEnvConfig,
  connectionLimit,
  queueLimit: 500,
  idleTimeout: 20000,
  // debug: process.env.NODE_ENV !== "production",
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  typeCast: function (field, next) {
    // Convert TINYINT(1) to boolean
    if (field.type === "TINY" && field.length === 1) {
      const value = field.string();
      return value === "1";
    }

    // Convert DATE fields to strings (YYYY-MM-DD format)
    // TIMESTAMP and DATETIME fields remain as Date objects (handled by next())
    // This ensures DATE fields (date-only, no time) are returned as strings,
    // while TIMESTAMP/DATETIME fields are returned as Date objects for proper UTC handling
    // field.type is a string (e.g., "DATE", "DATETIME", "TIMESTAMP")
    if (field.type === "DATE") {
      return field.string();
    }
    return next();
  }
} satisfies PoolOptions);

// Monitor pool events for diagnostics
dbPool.on("connection", (connection) => {
  logger.debug(
    `New database connection established (ID: ${connection.threadId})`
  );
});

// Log pool exhaustion warnings
let lastExhaustionWarning = 0;
const EXHAUSTION_WARNING_INTERVAL = 60000; // 1 minute

dbPool.on("acquire", () => {
  const poolStats = getPoolStatsInternal();
  const activeConnections = poolStats.active;
  const queuedRequests = poolStats.queued;

  // Warn if pool is getting exhausted
  if (activeConnections >= connectionLimit * 0.8 || queuedRequests > 0) {
    const now = Date.now();
    if (now - lastExhaustionWarning > EXHAUSTION_WARNING_INTERVAL) {
      logger.warn(
        `Database pool high usage: ${activeConnections}/${connectionLimit} connections active, ${queuedRequests} queued`
      );
      lastExhaustionWarning = now;
    }
  }
});

dbPool.on("release", (connection) => {
  logger.debug(`Database connection released (ID: ${connection.threadId})`);
});

export const getConnection = () => {
  return dbPool.getConnection();
};

export const endDbConnection = async () => {
  return dbPool.end();
};

/**
 * Internal function to get pool statistics
 * Accesses internal pool state safely
 */
const getPoolStatsInternal = () => {
  // Access internal pool state - these are internal properties of mysql2 Pool
  const poolState = dbPool.pool as unknown as {
    _allConnections?: unknown[];
    _freeConnections?: unknown[];
    _connectionQueue?: unknown[];
    _config?: { connectionLimit: number; queueLimit: number };
  };

  const totalConnections = poolState._allConnections?.length ?? 0;
  const freeConnections = poolState._freeConnections?.length ?? 0;
  const activeConnections = totalConnections - freeConnections;
  const queuedRequests = poolState._connectionQueue?.length ?? 0;
  const config = poolState._config;

  return {
    total: totalConnections,
    active: activeConnections,
    free: freeConnections,
    queued: queuedRequests,
    limit: config?.connectionLimit ?? connectionLimit,
    queueLimit: config?.queueLimit ?? 500,
    utilizationPercent: config?.connectionLimit
      ? Math.round((activeConnections / config.connectionLimit) * 100)
      : 0
  };
};

/**
 * Get current pool statistics for monitoring
 */
export const getPoolStats = () => {
  return getPoolStatsInternal();
};
