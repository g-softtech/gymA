import { NextResponse } from "next/server";
import { PLATFORM_PLANS } from "@/lib/billing/pricingConfig";

export async function GET() {
  return NextResponse.json({ data: Object.values(PLATFORM_PLANS) });
}
