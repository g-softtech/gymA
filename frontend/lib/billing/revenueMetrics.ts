import { logger } from "@/lib/logger";

export function recordMetric(key: string, value: number = 1, context?: any) {
  logger.info(`Metric emitted: ${key}`, { metric: key, value, ...context });
}

