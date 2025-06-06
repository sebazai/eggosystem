import winston from "winston";
import Transport from "winston-transport";
import {
  LoggerProvider,
  BatchLogRecordProcessor
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { context, trace } from "@opentelemetry/api";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "eggosystem-backend-1";
const resource = resourceFromAttributes({
  "service.name": serviceName,
  "service.namespace": process.env.OTEL_SERVICE_NAMESPACE ?? "eggosystem",
  "deployment.environment": process.env.NODE_ENV ?? "production"
});

const exporter = new OTLPLogExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    "http://localhost:4318/v1/logs"
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor(exporter)]
});

const otelLogger = loggerProvider.getLogger("default", "1.0.0");

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
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} ${level}: ${message} ${stack ? `\n${stack}` : ""}`;
        })
      )
    }),
    new OTelTransport()
  ]
});
