"use server";

import { getAuthSession } from "@/lib/auth";
import { getUserAccessContext } from "@/lib/access-control";
import { resetDemoEnvironmentService } from "@/lib/demo/seed";

export async function resetDemoEnvironment() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ctx = getUserAccessContext(session);
  
  // Strict authorization: Only Superadmin can manually trigger the reset
  if (ctx.role !== "SUPERADMIN") {
    throw new Error("Forbidden: Only SUPERADMIN can reset the demo environment.");
  }

  try {
    await resetDemoEnvironmentService();
    return { success: true };
  } catch (error: any) {
    console.error("Demo Reset Failed:", error);
    return { success: false, error: error.message };
  }
}
