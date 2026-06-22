import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.trainerProfile.updateMany({
      data: { showOnWebsite: true }
    });
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
