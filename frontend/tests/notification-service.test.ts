import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Inject mocks before importing modules that depend on them
import { loggerMock } from "./mocks/logger";
import { emailProviderMock } from "./mocks/emailProvider";

vi.mock("@/lib/notifications/NotificationRepository");

// SUT
import { AdminNotificationService } from "@/lib/notifications/AdminNotificationService";
import { NotificationRepository } from "@/lib/notifications/NotificationRepository";
import { AdminNotificationType } from "@prisma/client";

describe("AdminNotificationService Integration Boundary", () => {
  let service: AdminNotificationService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00Z"));

    // Set up test environment variables
    vi.stubEnv("SUPERADMIN_EMAILS", "admin1@example.com,admin2@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    // Assemble service with abstractions (Provider injected)
    service = new AdminNotificationService(emailProviderMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("should successfully log outcome and call provider when dispatching notification", async () => {
    // Arrange
    const payload = {
      gymName: "Integration Test Gym",
      ownerName: "Jane Doe",
      ownerEmail: "jane@test.com",
      plan: "FREE",
      timestamp: new Date().toISOString()
    };
    const correlationId = "test-corr-id";

    (NotificationRepository as any).createLog.mockResolvedValue({ id: "db-id-123" });
    (emailProviderMock.sendEmail as any).mockResolvedValue({ success: true });
    (NotificationRepository as any).updateStatus.mockResolvedValue({});

    // Act
    await service.sendNotification(
      AdminNotificationType.NEW_TENANT_SIGNUP,
      payload,
      "tenant-123",
      correlationId
    );

    // Assert: Observable Outcomes
    // 1. Logs created
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.stringContaining("Notification sent successfully"),
      expect.objectContaining({ correlationId })
    );

    // 2. Provider called once with all admins
    expect(emailProviderMock.sendEmail).toHaveBeenCalledTimes(1);
    expect(emailProviderMock.sendEmail).toHaveBeenCalledWith(
      ["admin1@example.com", "admin2@example.com"],
      "[Action Required] New Gym Signup: Integration Test Gym",
      expect.stringContaining("Integration Test Gym"),
      expect.any(String)
    );

    // 3. Repository called correctly (idempotency enforcement tracked via DB constraint logic)
    expect((NotificationRepository as any).createLog).toHaveBeenCalled();
    expect((NotificationRepository as any).updateStatus).toHaveBeenCalled();
  });

  it("should enforce idempotency by trapping repository collisions without crashing", async () => {
    // Arrange
    const payload = {
      gymName: "Duplicate Gym",
      ownerName: "John Doe",
      ownerEmail: "john@test.com",
      plan: "STARTER",
      timestamp: new Date().toISOString()
    };
    
    // Simulate Prisma P2002 Unique Constraint Violation
    const duplicateError = new Error("Unique constraint failed");
    (duplicateError as any).code = "P2002";
    (NotificationRepository as any).createLog.mockRejectedValue(duplicateError);

    // Act
    await service.sendNotification(
      AdminNotificationType.NEW_TENANT_SIGNUP,
      payload,
      "tenant-dup"
    );

    // Assert
    // 1. Should log the duplicate attempt safely
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate notification prevented"),
      expect.any(Object)
    );

    // 2. Provider should NOT be called
    expect(emailProviderMock.sendEmail).not.toHaveBeenCalled();
  });

  it("should record failure path safely if provider throws an error", async () => {
    // Arrange
    const payload = {
      gymName: "Fail Gym",
      ownerName: "John Doe",
      ownerEmail: "john@test.com",
      plan: "STARTER",
      timestamp: new Date().toISOString()
    };
    
    (NotificationRepository as any).createLog.mockResolvedValue({ id: "db-id-fail" });
    
    // Simulate provider failure
    (emailProviderMock.sendEmail as any).mockRejectedValue(new Error("Network Error"));
    (NotificationRepository as any).updateStatus.mockResolvedValue({});

    // Act
    await service.sendNotification(AdminNotificationType.NEW_TENANT_SIGNUP, payload);

    // Assert
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to dispatch notification"),
      expect.any(Error),
      expect.any(Object)
    );
    expect((NotificationRepository as any).updateStatus).toHaveBeenCalledWith(
      "db-id-fail",
      "FAILED",
      "Network Error"
    );
  });
});
