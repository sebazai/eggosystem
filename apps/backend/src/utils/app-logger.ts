import winston from "winston";
import Transport from "winston-transport";
import {
  LoggerProvider,
  BatchLogRecordProcessor
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { ATTR_SERVICE_NAMESPACE } from "@opentelemetry/semantic-conventions/incubating";

const serviceName = process.env.OTEL_SERVICE_NAME || "eggosystem-backend-1";
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_NAMESPACE]: process.env.OTEL_SERVICE_NAMESPACE || "eggosystem",
  "deployment.environment": process.env.NODE_ENV || "production"
});

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const exporter = new OTLPLogExporter({
  url: endpoint
});

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));

const otelLogger = loggerProvider.getLogger(serviceName);

// Winston <-> OTel severity mapping
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
    otelLogger.emit({
      body: info.message,
      severityNumber: severityMap[info.level] || 9,
      severityText: info.level.toUpperCase(),
      attributes: { ...info }
    });
    callback();
  }
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console(), new OTelTransport()]
});
