import { Clock } from "./Clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

// Global default instance for production use
export const systemClock = new SystemClock();
