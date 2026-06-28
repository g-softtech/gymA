import { waitUntil } from "@vercel/functions";
import { logger } from "./logger";

export const BackgroundTaskRunner = {
  /**
   * Executes a background task safely without blocking the HTTP response.
   * Leverages Vercel's waitUntil to prevent premature termination.
   * 
   * Captures execution metrics and logs them with the correlation ID.
   */
  execute(
    taskName: string, 
    correlationId: string, 
    taskFn: () => Promise<void>
  ): void {
    const safeTask = async () => {
      const startTime = performance.now();
      logger.info(`Background task [${taskName}] started`, { correlationId });

      try {
        await taskFn();
        
        const durationMs = (performance.now() - startTime).toFixed(2);
        logger.info(`Background task [${taskName}] completed successfully in ${durationMs}ms`, { 
          correlationId,
          durationMs
        });
      } catch (error: any) {
        const durationMs = (performance.now() - startTime).toFixed(2);
        logger.error(`Background task [${taskName}] failed after ${durationMs}ms`, error, { 
          correlationId,
          durationMs
        });
      }
    };

    // Integrate with Vercel infrastructure to keep function alive
    waitUntil(safeTask());
  }
};
