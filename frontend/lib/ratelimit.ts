import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────────────────────────────────────
// Redis client — only initialised when env vars are present.
// In local development without Upstash, rate limiting is a no-op.
// ─────────────────────────────────────────────────────────────────────────────

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

// ─────────────────────────────────────────────────────────────────────────────
// Limiters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI feature limiter — 20 requests per user per hour (sliding window).
 *
 * Key: user ID
 * Applies to: /api/ai/chat, /api/ai/workout, /api/ai/nutrition, /api/ai/progress
 *
 * 20/hr gives a real user plenty of headroom (a typical session might use 3–5)
 * while blocking automated abuse.
 */
export const aiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "rl:ai",
    })
  : null;

/**
 * General API limiter — 60 requests per user per minute (sliding window).
 *
 * Key: user ID
 * A safety net for burst abuse on any API route.
 */
export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "rl:api",
    })
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: enforce an AI rate limit check
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  limited: boolean;
  /** NextResponse to return if limited is true */
  response?: Response;
}

/**
 * Checks the AI rate limit for the given userId.
 *
 * Usage in an API route:
 *   const rl = await checkAiRateLimit(session.user.id);
 *   if (rl.limited) return rl.response!;
 *
 * If Redis is not configured, always returns { limited: false }.
 */
export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  if (!aiRatelimit) {
    // No Redis configured — skip in dev or non-production environments
    return { limited: false };
  }

  const { success, limit, remaining, reset } = await aiRatelimit.limit(userId);

  if (success) {
    return { limited: false };
  }

  const resetInSeconds = Math.ceil((reset - Date.now()) / 1000);
  const resetInMinutes = Math.ceil(resetInSeconds / 60);

  const response = new Response(
    JSON.stringify({
      error: `AI rate limit reached. You can make ${limit} AI requests per hour. Try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? "s" : ""}.`,
      retryAfterSeconds: resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(resetInSeconds),
      },
    }
  );

  return { limited: true, response };
}
