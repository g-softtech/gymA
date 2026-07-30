/**
 * auth-tokens.ts
 * 
 * Helper to create NextAuth email verification tokens programmatically.
 * Used to embed magic sign-in links into transactional emails
 * (e.g. the Gym Owner Welcome email's "Go to Dashboard" button).
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Creates a NextAuth-compatible email verification token for the given
 * email address and stores it in the VerificationToken table.
 * 
 * The returned token can be used to construct a magic sign-in URL:
 * `/api/auth/callback/email?callbackUrl=...&token=TOKEN&email=EMAIL`
 */
export async function createVerificationToken(
  email: string,
  callbackUrl: string,
  expiresInMs = 24 * 60 * 60 * 1000 // 24 hours
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + expiresInMs);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}
