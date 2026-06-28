import { vi } from "vitest";

export const prismaMock = {
  adminNotificationLog: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
