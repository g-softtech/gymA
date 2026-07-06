import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback_secret_for_qr_generation_only"
);

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.memberProfile.findFirst({
      where: { user: { email: session.user.email } },
      include: { user: true }
    });

    if (!member || !member.user.tenantId) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    const tenantId = member.user.tenantId;

    // Generate cryptographic nonce
    const nonce = crypto.randomBytes(16).toString("hex");

    // Save nonce to MemberProfile to prevent replay attacks and set a strict 60s TTL
    const expiresAt = new Date(Date.now() + 60000); // 60 seconds

    await prisma.memberProfile.update({
      where: { id: member.id },
      data: { 
        lastQrNonce: nonce,
        qrNonceExpiresAt: expiresAt
      }
    });

    // Create JWT with 60-second expiration
    // Payload includes nonce, tenantId, and memberId
    const alg = "HS256";
    const jwt = await new SignJWT({
      memberId: member.id,
      tenantId: tenantId,
      nonce: nonce
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("60s")
      .sign(JWT_SECRET);

    return NextResponse.json({
      token: jwt,
      expiresIn: 60
    });

  } catch (error) {
    console.error("QR Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
