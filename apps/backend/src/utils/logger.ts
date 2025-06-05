interface LogContext {
  [key: string]: string | number | boolean | object | null | undefined;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string = "eggosystem-backend") {
    this.serviceName = serviceName;
  }

  private formatMessage(message: string, context?: LogContext): string {
    const servicePrefix = `[${this.serviceName}]`;
    if (context && Object.keys(context).length > 0) {
      return `${servicePrefix} ${message} ${JSON.stringify(context)}`;
    }
    return `${servicePrefix} ${message}`;
  }

  info(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage(message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage(message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          : String(error)
    };

    console.error(this.formatMessage(message, errorContext));
  }

  debug(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage(message, context));
  }

  // HTTP request logging
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ) {
    const httpContext: LogContext = {
      http: {
        method,
        url,
        status_code: statusCode,
        response_time_ms: responseTime
      },
      ...context
    };

    this.info(
      `${method} ${url} ${statusCode} - ${responseTime}ms`,
      httpContext
    );
  }

  // Database operation logging
  dbQuery(query: string, duration: number, context?: LogContext) {
    const dbContext: LogContext = {
      db: {
        query_type: query.split(" ")[0].toUpperCase(),
        duration_ms: duration
      },
      ...context
    };

    this.debug(`DB Query executed in ${duration}ms`, dbContext);
  }

  // Authentication logging
  auth(action: string, userId?: string, context?: LogContext) {
    const authContext: LogContext = {
      auth: {
        action,
        user_id: userId
      },
      ...context
    };

    this.info(`Auth: ${action}`, authContext);
  }
}

// Export a singleton logger instance
export const appLogger = new Logger();

// Export the Logger class for creating specific loggers
export { Logger };
