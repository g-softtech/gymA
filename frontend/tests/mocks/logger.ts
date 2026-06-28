import { vi } from "vitest";

export const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
  logger: loggerMock,
}));
