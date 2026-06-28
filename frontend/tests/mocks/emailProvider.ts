import { vi } from "vitest";
import { IEmailProvider } from "@/lib/notifications/types";

export const emailProviderMock: IEmailProvider = {
  sendEmail: vi.fn(),
};
