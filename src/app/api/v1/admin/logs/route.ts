import { NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (isAuthError(admin)) return admin;

  const logs = userStore.getAuditLogs();
  return NextResponse.json({ logs });
}
