import { NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";
import { dataStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (isAuthError(admin)) return admin;

  const userStats = userStore.getStats();
  const reportResults = dataStore.getReports({ limit: 500 });
  const allReports = reportResults.reports;

  const activeHazards = allReports.filter(
    (r) => r.status !== "resolved" && r.status !== "archived"
  ).length;

  const resolvedHazards = allReports.filter((r) => r.status === "resolved").length;

  const totalConfirms = allReports.reduce((acc, r) => acc + (r.confirmCount || 0), 0);
  const totalDisputes = allReports.reduce((acc, r) => acc + (r.disputeCount || 0), 0);

  const abuseReports = dataStore.getAbuseReports();
  const modLogs = dataStore.getModerationLogs();
  const adminLogs = userStore.getAuditLogs();

  return NextResponse.json({
    users: userStats,
    reports: {
      total: reportResults.total,
      active: activeHazards,
      resolved: resolvedHazards,
      totalConfirms,
      totalDisputes,
    },
    governance: {
      pendingAbuseCount: abuseReports.filter((a) => a.reviewStatus === "pending").length,
      moderationActionsCount: modLogs.length,
      adminAuditLogsCount: adminLogs.length,
    },
    system: {
      status: "healthy",
      version: "0.2.0-civic",
      nodeEnv: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
}
