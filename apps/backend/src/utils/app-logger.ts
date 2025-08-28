import winston from "winston";
import Transport from "winston-transport";
import {
  LoggerProvider,
  BatchLogRecordProcessor
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { context, trace } from "@opentelemetry/api";
import { isEmpty } from "lodash";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "eggosystem-backend-1";
const resource = resourceFromAttributes({
  "service.name": serviceName,
  "service.namespace": process.env.OTEL_SERVICE_NAMESPACE ?? "eggosystem",
  "deployment.environment": process.env.NODE_ENV ?? "production"
});

// Only initialize OpenTelemetry if not in test environment
const isTestEnvironment = process.env.NODE_ENV === "test";

let loggerProvider: LoggerProvider | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let otelLogger: any = null; // Logger type not exported from @opentelemetry/sdk-logs

if (!isTestEnvironment) {
  const exporter = new OTLPLogExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
      "http://localhost:4318/v1/logs"
  });

  loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(exporter)]
  });

  otelLogger = loggerProvider.getLogger("default", "1.0.0");
}

const severityMap: Record<string, number> = {
  error: 17,
  warn: 13,
  info: 9,
  http: 9,
  verbose: 5,
  debug: 5,
  silly: 1
};

class OTelTransport extends Transport {
  log(info: winston.LogEntry, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    // Only send to OpenTelemetry if not in test environment and logger is initialized
    if (!isTestEnvironment && otelLogger) {
      try {
        // Inject trace/span context if available
        const activeSpan = trace.getSpan(context.active());
        const traceId = activeSpan?.spanContext().traceId;
        const spanId = activeSpan?.spanContext().spanId;

        otelLogger.emit({
          body: info.message,
          severityNumber: severityMap[info.level] || 9,
          severityText: info.level.toUpperCase(),
          attributes: {
            ...info,
            ...(traceId && { trace_id: traceId }),
            ...(spanId && { span_id: spanId })
          }
        });
      } catch (error) {
        // Silently handle any OpenTelemetry errors to prevent test failures
        console.warn("OpenTelemetry logging error:", error);
      }
    }
    callback();
  }
}

export const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.printf(
          ({ level, message, timestamp, stack, ...rest }) => {
            return `${timestamp} ${level}: ${message} ${stack ? `\n${stack}` : ""} ${typeof rest === "object" && !isEmpty(rest) ? JSON.stringify(rest, null, 2) : isEmpty(rest) ? "" : rest}`;
          }
        )
      ),
      silent: process.env.NODE_ENV === "test"
    }),
    new OTelTransport()
  ]
});

// Export cleanup function for tests
export const cleanupLogger = async () => {
  if (loggerProvider) {
    await loggerProvider.shutdown();
  }
};
