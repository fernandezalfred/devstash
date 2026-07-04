import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting for auth endpoints, backed by Upstash Redis over HTTP (works in
// serverless/edge). It is intentionally OPTIONAL: when the Upstash env vars are
// missing (e.g. local dev) or Redis is unreachable, every check FAILS OPEN so
// the app keeps working — rate limiting is a hardening layer, not a hard
// dependency. Server/Node only; never import this into the edge auth.config.ts.

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// Shared in-memory cache so an already-blocked identifier is rejected without a
// round-trip to Redis. Must live at module scope (not per-request).
const ephemeralCache = new Map<string, number>();

type LimiterConfig = {
  /** Max requests allowed within the window. */
  tokens: number;
  /** Sliding window duration, e.g. "15 m" or "1 h". */
  window: `${number} ${"s" | "m" | "h"}`;
  /** Redis key prefix so the different limiters never collide. */
  prefix: string;
};

// Per-endpoint limits (see context/current-feature.md). Keying (IP vs IP+email)
// is decided by the caller via the identifier it passes to checkRateLimit.
const LIMITER_CONFIGS = {
  login: { tokens: 5, window: "15 m", prefix: "login" },
  register: { tokens: 3, window: "1 h", prefix: "register" },
  forgotPassword: { tokens: 3, window: "1 h", prefix: "forgot-password" },
  resetPassword: { tokens: 5, window: "15 m", prefix: "reset-password" },
  resendVerification: { tokens: 3, window: "15 m", prefix: "resend-verification" },
} satisfies Record<string, LimiterConfig>;

export type LimiterName = keyof typeof LIMITER_CONFIGS;

function buildLimiter(config: LimiterConfig): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.tokens, config.window),
    ephemeralCache,
    // Allow the request through if Redis doesn't answer within 1s (fail-open).
    timeout: 1000,
    prefix: `ratelimit:${config.prefix}`,
    analytics: false,
  });
}

const limiters: Record<LimiterName, Ratelimit | null> = {
  login: buildLimiter(LIMITER_CONFIGS.login),
  register: buildLimiter(LIMITER_CONFIGS.register),
  forgotPassword: buildLimiter(LIMITER_CONFIGS.forgotPassword),
  resetPassword: buildLimiter(LIMITER_CONFIGS.resetPassword),
  resendVerification: buildLimiter(LIMITER_CONFIGS.resendVerification),
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Unix timestamp (ms) when the limit resets. 0 when not rate limited. */
  reset: number;
};

/**
 * Check `identifier` against the named limiter. Fails open (returns success)
 * when rate limiting is not configured or the check throws.
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = limiters[name];
  if (!limiter) {
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }

  try {
    const { success, remaining, reset, pending } = await limiter.limit(identifier);
    // Don't block the response on background analytics/sync; swallow any error.
    void Promise.resolve(pending).catch(() => {});
    return { success, remaining, reset };
  } catch (err) {
    console.error(`Rate limit check failed for "${name}"; allowing request`, err);
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
}

/**
 * Best-effort client IP from proxy headers (Vercel sets `x-forwarded-for`).
 * Falls back to "unknown" so a missing header still yields a stable key.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Time left until a limit resets, derived from its unix-ms `reset` timestamp.
 * Both values are floored to a minimum of 1 so messaging never says "0".
 */
export function retryAfter(reset: number): { seconds: number; minutes: number } {
  const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return { seconds, minutes };
}

/** Human "in X minute(s)" phrase for a given number of minutes. */
export function retryPhrase(minutes: number): string {
  return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Build the standard 429 response: friendly JSON message + `Retry-After` header.
 * `reset` is the unix-ms timestamp from a RateLimitResult.
 */
export function tooManyRequests(reset: number): NextResponse {
  const { seconds, minutes } = retryAfter(reset);
  return NextResponse.json(
    { error: `Too many attempts. Please try again ${retryPhrase(minutes)}.` },
    {
      status: 429,
      headers: { "Retry-After": String(seconds) },
    },
  );
}
