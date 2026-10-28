import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// ─── Simple in-process rate limiter ──────────────────────────────────────────
// For production with multiple instances, replace with Upstash Redis.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max number of requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Key prefix to namespace different limiters */
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limit by a key (typically hashed IP).
 * Returns whether the request is allowed and remaining quota.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const storeKey = `${options.prefix}:${key}`;
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  let entry = store.get(storeKey);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(storeKey, entry);
    return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  entry.count++;
  const allowed = entry.count <= options.limit;
  return {
    allowed,
    remaining: Math.max(0, options.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Extract a privacy-safe fingerprint from a request.
 * Hashes the IP address — never stores the raw IP.
 */
export function getAnonFingerprint(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  // Add a daily rotating salt so fingerprints can't be tracked across days
  const today = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}:${today}:nirapod-salt`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Middleware helper: apply rate limiting and return 429 if exceeded.
 */
export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const fingerprint = getAnonFingerprint(request);
  const result = rateLimit(fingerprint, options);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait before trying again.",
        resetAt: new Date(result.resetAt).toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// ─── Preset limiters ─────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  anonReport: {
    prefix: "anon:report",
    limit: parseInt(process.env.RATE_LIMIT_ANONYMOUS_REPORTS_PER_HOUR ?? "5"),
    windowSeconds: 3600,
  },
  anonVerify: {
    prefix: "anon:verify",
    limit: parseInt(process.env.RATE_LIMIT_ANONYMOUS_VERIFICATIONS_PER_HOUR ?? "20"),
    windowSeconds: 3600,
  },
  anonUpdate: {
    prefix: "anon:update",
    limit: 10,
    windowSeconds: 3600,
  },
  anonAbuse: {
    prefix: "anon:abuse",
    limit: 5,
    windowSeconds: 3600,
  },
} as const;
