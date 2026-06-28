/**
 * Centralized logging utility with correlation ID support.
 * Useful for tracing background jobs, API requests, and webhooks.
 */

export interface LogContext {
  correlationId?: string;
  [key: string]: any;
}

function formatMessage(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const correlationId = context?.correlationId ? `[${context.correlationId}] ` : "";
  let metaStr = "";
  
  if (context) {
    const { correlationId: _, ...meta } = context;
    if (Object.keys(meta).length > 0) {
      try {
        metaStr = ` | meta: ${JSON.stringify(meta)}`;
      } catch {
        metaStr = ` | meta: [Circular]`;
      }
    }
  }

  return `[${timestamp}] [${level}] ${correlationId}${message}${metaStr}`;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(formatMessage("INFO", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("WARN", message, context));
  },
  error(message: string, error?: any, context?: LogContext) {
    console.error(formatMessage("ERROR", message, context));
    if (error instanceof Error) {
      console.error(`[ERROR STACK]: ${error.stack}`);
    } else if (error) {
      console.error(`[ERROR DETAILS]: ${JSON.stringify(error)}`);
    }
  },
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("DEBUG", message, context));
    }
  }
};
