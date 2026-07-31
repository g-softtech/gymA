import { Session } from "next-auth";

/**
 * Custom error thrown when a high-risk action requires the user
 * to have authenticated recently.
 */
export class StepUpRequiredError extends Error {
  public reason: string;

  constructor(message = "Recent authentication required") {
    super(message);
    this.name = "StepUpRequiredError";
    this.reason = "RECENT_AUTH_REQUIRED";
  }
}

/**
 * Ensures the user has authenticated within the given maxAgeMinutes.
 * If the session's authenticatedAt is older (or missing), this throws
 * a StepUpRequiredError which should be caught by API route handlers
 * to return a 403 STEP_UP_REQUIRED response.
 *
 * @param session The NextAuth session object
 * @param maxAgeMinutes The maximum allowed age of the authentication in minutes (default 15)
 */
export async function requireRecentAuth(session: Session, maxAgeMinutes = 15) {
  if (!session?.user) {
    throw new Error("Unauthorized: No active session");
  }

  const { authenticatedAt } = session.user;

  // If we somehow have no authenticatedAt (legacy sessions before this feature),
  // we force them to authenticate.
  if (!authenticatedAt) {
    throw new StepUpRequiredError();
  }

  const ageMs = Date.now() - authenticatedAt;
  const maxAgeMs = maxAgeMinutes * 60 * 1000;

  if (ageMs > maxAgeMs) {
    throw new StepUpRequiredError();
  }
}
