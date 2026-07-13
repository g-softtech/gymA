import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({ txs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
