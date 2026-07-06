import { AnySubscriptionEvent, SubscriptionEventType } from "./events";

export type EventHandler<T extends AnySubscriptionEvent> = (event: T) => Promise<void>;

export interface PublishResult {
  successfulHandlers: number;
  failedHandlers: number;
  failures: { handlerName: string; error: unknown }[];
}

export interface ISubscriptionEventBus {
  publish(event: AnySubscriptionEvent): Promise<PublishResult>;
  subscribe<T extends AnySubscriptionEvent>(
    type: T["type"],
    handler: EventHandler<T>
  ): void;
}

class InMemorySubscriptionEventBus implements ISubscriptionEventBus {
  private handlers: Map<SubscriptionEventType, EventHandler<any>[]> = new Map();

  subscribe<T extends AnySubscriptionEvent>(
    type: T["type"],
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(type) || [];
    if (!existing.includes(handler)) {
      this.handlers.set(type, [...existing, handler]);
    }
  }

  /**
   * Publishes an event to all registered subscribers.
   * 
   * WARNING: In a Serverless environment (like Vercel), we MUST await all handlers
   * synchronously to ensure they complete before the HTTP response context is destroyed.
   * Fire-and-forget is NOT safe here for side-effects like Audit Logging or Caching.
   */
  async publish(event: AnySubscriptionEvent): Promise<PublishResult> {
    const eventHandlers = this.handlers.get(event.type) || [];
    
    console.log(`[SubscriptionEventBus] Publishing ${event.type} (Correlation: ${event.correlationId})`);

    const result: PublishResult = {
      successfulHandlers: 0,
      failedHandlers: 0,
      failures: [],
    };

    // Execute handlers sequentially to avoid DB connection pool exhaustion,
    // but catch ALL errors so one handler doesn't starve the rest.
    for (const handler of eventHandlers) {
      try {
        await handler(event);
        result.successfulHandlers++;
      } catch (err) {
        console.error(`[SubscriptionEventBus] Error in handler for ${event.type}:`, err);
        result.failedHandlers++;
        result.failures.push({
          handlerName: handler.name || "anonymous",
          error: err,
        });
      }
    }

    if (result.failedHandlers > 0) {
      console.warn(`[SubscriptionEventBus] ${event.type} completed with ${result.failedHandlers} handler failures.`);
    }

    return result;
  }
}

export const subscriptionDomainBus = new InMemorySubscriptionEventBus();
