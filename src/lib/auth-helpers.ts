import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
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

/**
 * Get the current authenticated session user, or null for anonymous.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/**
 * Require authentication — returns 401 JSON response if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to proceed." },
      { status: 401 }
    );
  }
  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "Your account has been suspended by the civic administration." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Require moderator or admin role.
 */
export async function requireModerator(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (user.role !== "moderator" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Moderator or Admin authorization required." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Require admin role strictly.
 */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Access denied. System Administrator privileges required." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Helper: check if a value is a NextResponse (auth failure) for early return.
 */
export function isAuthError(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
