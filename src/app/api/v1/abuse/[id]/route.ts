import { NextRequest, NextResponse } from "next/server";
import { requireModerator, isAuthError } from "@/lib/auth-helpers";
import { dataStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

// PATCH /api/v1/abuse/[id] — resolve or dismiss abuse report (Moderator only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mod = await requireModerator();
  if (isAuthError(mod)) return mod;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reviewStatus, action, notes } = body;
  if (!["reviewed", "actioned", "dismissed"].includes(reviewStatus)) {
    return NextResponse.json({ error: "Invalid review status" }, { status: 422 });
  }

  const abuseReports = dataStore.getAbuseReports();
  const target = abuseReports.find((a) => a.id === params.id);
  if (!target) {
    return NextResponse.json({ error: "Abuse report not found" }, { status: 404 });
  }

  target.reviewStatus = reviewStatus;
  target.reviewedAt = new Date().toISOString();
  target.reviewedByUserId = mod.id;

  // If actioned and targets a report, optionally flag or archive the target report
  if (action === "archive_target" && target.targetReportId) {
    dataStore.moderateReport({
      reportId: target.targetReportId,
      action: "archive",
      reason: `Takedown due to confirmed abuse: ${target.reason} - ${notes || "No notes"}`,
      moderatorId: mod.id,
    });
  }

  return NextResponse.json({ success: true, abuseReport: target });
}
