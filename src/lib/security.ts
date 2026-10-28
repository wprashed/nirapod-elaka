import crypto from "crypto";

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || "nirapod-civic-secret-key-32-bytes-minimum-security-salt";
export const SESSION_COOKIE_NAME = "nirapod_session";

// ─── Password Hashing (PBKDF2 with SHA-512) ──────────────────────────────────
// 100,000 iterations with unique salt per user guarantees resistance to rainbow tables & brute force.

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computedHash, "hex"));
  } catch {
    return false;
  }
}

// ─── Tamper-Proof Session Token (HMAC-SHA256 Signed) ─────────────────────────

export interface SessionPayload {
  userId: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended";
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

export function createSessionToken(payload: Omit<SessionPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const fullPayload: SessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, providedSignature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
