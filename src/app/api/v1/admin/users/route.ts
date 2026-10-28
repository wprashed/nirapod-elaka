import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";
import { sanitizeInput } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/users — list and search users (Admin only)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (isAuthError(admin)) return admin;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;

  const users = userStore.listUsers(search);
  const stats = userStore.getStats();

  return NextResponse.json({ users, stats });
}

// PATCH /api/v1/admin/users — modify role or status with mandatory reason (Admin only)
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (isAuthError(admin)) return admin;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, action, role, status, reason } = body;

  if (!userId || !action || !reason || reason.trim().length < 3) {
    return NextResponse.json(
      { error: "userId, action, and a reason (min 3 chars) are required." },
      { status: 422 }
    );
  }

  const cleanReason = sanitizeInput(reason);

  try {
    // Prevent self-demotion or self-suspension
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Security restriction: You cannot modify your own administrative privileges or status." },
        { status: 400 }
      );
    }

    if (action === "change_role") {
      if (!["user", "moderator", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role specified." }, { status: 422 });
      }

      const updated = userStore.updateUserRole(
        userId,
        role,
        { id: admin.id, email: admin.email },
        cleanReason
      );

      const { passwordHash, passwordSalt, ...safeUser } = updated;
      return NextResponse.json({ success: true, user: safeUser });
    } else if (action === "change_status") {
      if (!["active", "suspended"].includes(status)) {
        return NextResponse.json({ error: "Invalid status specified." }, { status: 422 });
      }

      const updated = userStore.updateUserStatus(
        userId,
        status,
        { id: admin.id, email: admin.email },
        cleanReason
      );

      const { passwordHash, passwordSalt, ...safeUser } = updated;
      return NextResponse.json({ success: true, user: safeUser });
    } else {
      return NextResponse.json({ error: "Unsupported action." }, { status: 422 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user." },
      { status: 500 }
    );
  }
}
