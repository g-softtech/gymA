import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: session.user.id } },
    });

    if (existing) {
      // Unlike
      await prisma.postLike.delete({
        where: { postId_userId: { postId, userId: session.user.id } },
      });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, count });
    } else {
      // Like
      await prisma.postLike.create({
        data: { postId, userId: session.user.id },
      });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: true, count });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
