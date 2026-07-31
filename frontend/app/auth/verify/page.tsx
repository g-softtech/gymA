import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export default async function VerifyChallengePage({
  searchParams,
}: {
  searchParams: { challenge?: string };
}) {
  const challengeId = searchParams.challenge;
  
  if (!challengeId) {
    redirect("/dashboard");
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 1. Validate the challenge
  const challenge = await prisma.stepUpChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Invalid Challenge</h1>
          <p className="text-muted-foreground mb-6">
            This verification link is invalid or has already been used.
          </p>
          <a href="/dashboard" className="text-indigo-500 hover:underline">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  // 2. Check ownership and expiry
  if (challenge.userId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to verify this action.
          </p>
          <a href="/dashboard" className="text-indigo-500 hover:underline">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  if (challenge.completedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Already Verified</h1>
          <p className="text-muted-foreground mb-6">
            This action was already verified.
          </p>
          <a href={challenge.returnUrl} className="text-indigo-500 hover:underline">Continue</a>
        </div>
      </div>
    );
  }

  if (new Date() > challenge.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-amber-500">Link Expired</h1>
          <p className="text-muted-foreground mb-6">
            This verification link has expired. Please try your action again to request a new link.
          </p>
          <a href={challenge.returnUrl} className="text-indigo-500 hover:underline">Return</a>
        </div>
      </div>
    );
  }

  // 3. Mark completed
  await prisma.stepUpChallenge.update({
    where: { id: challenge.id },
    data: { completedAt: new Date() },
  });

  // 4. Redirect seamlessly back to the action
  redirect(challenge.returnUrl);
}
