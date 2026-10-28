import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/security";
import { userStore } from "@/lib/user-store";

describe("Security & Cryptographic Guarantees", () => {
  it("hashes password with PBKDF2 and verifies accurately", () => {
    const raw = "SecurePass@2026";
    const { hash, salt } = hashPassword(raw);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash.length).toBe(128); // 64 bytes in hex

    expect(verifyPassword(raw, hash, salt)).toBe(true);
    expect(verifyPassword("WrongPassword", hash, salt)).toBe(false);
  });

  it("creates and verifies signed HMAC-SHA256 session tokens", () => {
    const token = createSessionToken({
      userId: "usr-123",
      name: "Tanvir Ahmed",
      email: "tanvir@example.com",
      role: "user",
      status: "active",
    });

    expect(token).toBeDefined();
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("usr-123");
    expect(payload?.role).toBe("user");
  });

  it("detects and rejects tampered or forged session tokens", () => {
    const token = createSessionToken({
      userId: "usr-123",
      name: "Regular User",
      email: "user@example.com",
      role: "user",
      status: "active",
    });

    const [payloadB64, sig] = token.split(".");
    // Tamper payload to elevate to admin
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        userId: "usr-123",
        name: "Regular User",
        email: "user@example.com",
        role: "admin", // FORGED ROLE
        status: "active",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 100000,
      })
    ).toString("base64url");

    const forgedToken = `${tamperedPayload}.${sig}`;
    expect(verifySessionToken(forgedToken)).toBeNull();
  });

  it("enforces admin audit logging upon user role elevation", () => {
    const admin = { id: "usr-admin-001", email: "admin@nirapod.local" };
    const user = userStore.findUserByEmail("user@nirapod.local");
    expect(user).not.toBeNull();

    const updated = userStore.updateUserRole(
      user!.id,
      "moderator",
      admin,
      "Appointed for Dhanmondi local ward duty"
    );

    expect(updated.role).toBe("moderator");

    const auditLogs = userStore.getAuditLogs();
    expect(auditLogs[0].action).toBe("role_change");
    expect(auditLogs[0].adminEmail).toBe("admin@nirapod.local");
    expect(auditLogs[0].details).toContain("Dhanmondi local ward duty");
  });
});
