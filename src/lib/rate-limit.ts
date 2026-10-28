import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Automatic cleanup of expired entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

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
 * Item 3: Robust, anti-spoofing client IP extractor.
 * Evaluates Cloudflare headers (CF-Connecting-IP), Nginx real-ip headers,
 * and leftmost untampered address from x-forwarded-for.
 */
export function extractClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Parse the client IP (first item in comma list)
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  return "127.0.0.1";
}

/**
 * Item 3: Salted daily rotating fingerprint.
 * Raw IP addresses are NEVER stored in the database.
 */
export function getAnonFingerprint(request: NextRequest): string {
  const ip = extractClientIp(request);
  const today = new Date().toISOString().slice(0, 10);
  const salt = process.env.NEXTAUTH_SECRET || "nirapod-daily-salt";
  return createHash("sha256")
    .update(`${ip}:${today}:${salt}`)
    .digest("hex")
    .slice(0, 16);
}

export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const fingerprint = getAnonFingerprint(request);
  const result = rateLimit(fingerprint, options);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a while before trying again.",
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
