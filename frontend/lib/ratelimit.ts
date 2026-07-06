import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Redis client
// ─────────────────────────────────────────────────────────────────────────────
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

// ─────────────────────────────────────────────────────────────────────────────
// Memory Fallback Cache for Local Dev
// ─────────────────────────────────────────────────────────────────────────────
const memoryCache = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = memoryCache.get(identifier);

  if (!record || record.resetAt < now) {
    memoryCache.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  memoryCache.set(identifier, record);
  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt };
}

// ─────────────────────────────────────────────────────────────────────────────
// Limiters
// ─────────────────────────────────────────────────────────────────────────────

const publicLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), analytics: true, prefix: "rl:public" })
  : null;

const authLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), analytics: true, prefix: "rl:auth" })
  : null;

export const aiRatelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), analytics: true, prefix: "rl:ai" })
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Checkers
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  limited: boolean;
  response?: Response;
}

function buildRateLimitResponse(limit: number, remaining: number, reset: number, customMessage?: string): Response {
  const resetInSeconds = Math.ceil((reset - Date.now()) / 1000);
  const resetInMinutes = Math.ceil(resetInSeconds / 60);

  return new NextResponse(
    JSON.stringify({
      error: customMessage || `Rate limit exceeded. Try again in ${resetInMinutes} minute(s).`,
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
}

export async function checkPublicRateLimit(ip: string): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = publicLimiter
    ? await publicLimiter.limit(ip)
    : memoryRateLimit(`public:${ip}`, 5, 60000);

  if (success) return { limited: false };
  return { limited: true, response: buildRateLimitResponse(limit, remaining, reset) };
}

export async function checkAuthRateLimit(userId: string): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = authLimiter
    ? await authLimiter.limit(userId)
    : memoryRateLimit(`auth:${userId}`, 100, 60000);

  if (success) return { limited: false };
  return { limited: true, response: buildRateLimitResponse(limit, remaining, reset) };
}

export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = aiRatelimit
    ? await aiRatelimit.limit(userId)
    : memoryRateLimit(`ai:${userId}`, 20, 3600000);

  if (success) return { limited: false };
  return {
    limited: true,
    response: buildRateLimitResponse(limit, remaining, reset, `AI rate limit reached. You can make ${limit} AI requests per hour.`),
  };
}
