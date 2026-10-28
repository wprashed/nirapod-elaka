import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

// GET /api/v1/moderation — get queue, logs, and abuse reports
export async function GET() {
  const queue = dataStore.getReports({ limit: 100 });
  const logs = dataStore.getModerationLogs();
  const abuse = dataStore.getAbuseReports();

  return NextResponse.json({
    queue: queue.reports,
    total: queue.total,
    logs,
    abuseReports: abuse,
  });
}

// POST /api/v1/moderation — perform moderation action
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reportId, action, reason, status, moderatorId = "mod-demo" } = body;

  if (!reportId || !action || !reason) {
    return NextResponse.json(
      { error: "reportId, action, and reason are required" },
      { status: 422 }
    );
  }

  const result = dataStore.moderateReport({
    reportId,
    action,
    reason,
    status,
    moderatorId,
  });

  if (!result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, ...result });
}
