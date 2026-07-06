import { Clock } from "./Clock";

export class MockClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date | string = new Date()) {
    this.currentTime = typeof initialTime === "string" ? new Date(initialTime) : initialTime;
  }

  now(): Date {
    // Return a clone to prevent external mutation
    return new Date(this.currentTime.getTime());
  }

  /**
   * Advances the mock clock by the specified number of milliseconds.
   */
  advance(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }

  /**
   * Sets the clock to a specific fixed time.
   */
  set(time: Date | string): void {
    this.currentTime = typeof time === "string" ? new Date(time) : time;
  }
}
