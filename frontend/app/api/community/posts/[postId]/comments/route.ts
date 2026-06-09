import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
