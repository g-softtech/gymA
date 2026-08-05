import { NextResponse } from "next/server";
import { resetDemoEnvironmentService } from "@/lib/demo/seed";

export const maxDuration = 300; // Allow Vercel Function to run for up to 5 minutes

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Executing automated nightly demo reset...");
    await resetDemoEnvironmentService();
    console.log("[CRON] Demo reset completed successfully.");

    return NextResponse.json({ success: true, message: "Demo environment successfully rebuilt." });
  } catch (error: any) {
    console.error("Cron Error [reset-demo]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
