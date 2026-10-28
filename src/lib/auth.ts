import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./security";
import { userStore } from "./user-store";

export interface UserSession {
  user: {
    id: string;
    role: "user" | "moderator" | "admin";
    status: "active" | "suspended";
    name: string;
    email: string;
    civicPoints?: number;
    badges?: string[];
    reportsSubmitted?: number;
    verificationsCount?: number;
    streakDays?: number;
  };
}

/**
 * Server-side helper to get current session from HTTP-only cookie.
 * Verifies HMAC signature, checks live account status, and asserts tokenVersion freshness.
 */
export async function auth(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    // Check user exists in store and hasn't been suspended
    const liveUser = userStore.findUserById(payload.userId);
    if (!liveUser || liveUser.status === "suspended") {
      return null;
    }

    // Item 2: Token version check (instant revocation on password change or suspension)
    if (liveUser.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return {
      user: {
        id: liveUser.id,
        role: liveUser.role,
        status: liveUser.status,
        name: liveUser.name,
        email: liveUser.email,
        civicPoints: liveUser.civicPoints || 0,
        badges: liveUser.badges || [],
        reportsSubmitted: liveUser.reportsSubmitted || 0,
        verificationsCount: liveUser.verificationsCount || 0,
        streakDays: liveUser.streakDays || 1,
      },
    };
  } catch {
    return null;
  }
}
