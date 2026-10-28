import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("Rate Limiting & Anti-Abuse", () => {
  it("allows requests within window threshold", () => {
    const key = `test-ip-${Date.now()}`;
    const opts = { limit: 3, windowSeconds: 60, prefix: "test" };

    const r1 = rateLimit(key, opts);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(key, opts);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(key, opts);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit
    const r4 = rateLimit(key, opts);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
