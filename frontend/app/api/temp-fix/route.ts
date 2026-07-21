import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.trainerProfile.updateMany({
      where: { showOnWebsite: false },
      data: { showOnWebsite: true }
    });
    return NextResponse.json({ success: true, updated: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
