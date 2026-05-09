import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterKey =
  | "login"
  | "register"
  | "forgotPassword"
  | "resetPassword"
  | "resendVerification";

type LimiterConfig = {
  tokens: number;
  windowSeconds: number;
};

const LIMITS: Record<LimiterKey, LimiterConfig> = {
  login: { tokens: 5, windowSeconds: 15 * 60 },
  register: { tokens: 3, windowSeconds: 60 * 60 },
  forgotPassword: { tokens: 3, windowSeconds: 60 * 60 },
  resetPassword: { tokens: 5, windowSeconds: 15 * 60 },
  resendVerification: { tokens: 3, windowSeconds: 15 * 60 },
};

const PREFIXES: Record<LimiterKey, string> = {
  login: "rl:login",
  register: "rl:register",
  forgotPassword: "rl:forgot-password",
  resetPassword: "rl:reset-password",
  resendVerification: "rl:resend-verification",
};

let redis: Redis | null = null;
let limiters: Partial<Record<LimiterKey, Ratelimit>> = {};

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(key: LimiterKey): Ratelimit | null {
  if (limiters[key]) return limiters[key]!;
  const client = getRedis();
  if (!client) return null;
  const { tokens, windowSeconds } = LIMITS[key];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
    prefix: PREFIXES[key],
    analytics: false,
  });
  limiters[key] = limiter;
  return limiter;
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
};

export async function checkRateLimit(
  key: LimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(key);
  // Fail-open when Upstash isn't configured or unreachable so a Redis outage
  // can't lock users out of auth.
  if (!limiter) {
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0, retryAfterSeconds: 0 };
  }
  try {
    const res = await limiter.limit(identifier);
    const retryAfterSeconds = res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return {
      success: res.success,
      remaining: res.remaining,
      reset: res.reset,
      retryAfterSeconds,
    };
  } catch (err) {
    console.error("[rate-limit] limiter failed, failing open", err);
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0, retryAfterSeconds: 0 };
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function formatRetryAfter(seconds: number): string {
  if (seconds <= 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function rateLimitedResponse(result: RateLimitResult, action = "attempts") {
  const wait = formatRetryAfter(result.retryAfterSeconds);
  return Response.json(
    { error: `Too many ${action}. Please try again in ${wait}.` },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
