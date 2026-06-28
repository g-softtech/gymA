import "dotenv/config";

async function runTest() {
  console.log("🚀 Testing Milestone 3 Notification Framework...");

  try {
    // We use dynamic imports to strictly guarantee that dotenv loads the DATABASE_URL 
    // *before* the Prisma Client is instantiated in the background!
    const { adminNotificationService } = await import("../lib/notifications/AdminNotificationService");
    const { AdminNotificationType } = await import("@prisma/client");

    await adminNotificationService.sendNotification(
      AdminNotificationType.NEW_TENANT_SIGNUP,
      {
        gymName: "Milestone 3 Test Gym",
        ownerName: "Test User",
        ownerEmail: "test@example.com",
        plan: "Premium",
        timestamp: new Date().toLocaleString(),
      },
      "test_tenant_123" // Mock tenant ID
    );

    console.log("✅ Test script completed! Check your server console logs above and your database.");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runTest();
