import { NextResponse } from "next/server";
import { STATIC_PLATFORM_PLANS } from "@/lib/billing/pricing.config";

export async function GET() {
  return NextResponse.json({ data: STATIC_PLATFORM_PLANS });
}
