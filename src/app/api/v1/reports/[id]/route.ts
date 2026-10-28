import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { sanitizeInput } from "@/lib/sanitize";

// GET /api/v1/reports/[id] — fetch single report details and updates
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = dataStore.getReportById(params.id);

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Never expose raw IP fingerprints
    const { anonFingerprint, ...safeReport } = report as any;

    return NextResponse.json({ report: safeReport });
  } catch (err) {
    console.error("GET /api/v1/reports/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch report." }, { status: 500 });
  }
}

// PATCH /api/v1/reports/[id] — update report status (moderator or system)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { status, reason, action = "change_status", moderatorId = "mod-demo" } = body;

  if (!reason || reason.trim().length < 3) {
    return NextResponse.json(
      { error: "A valid moderation reason is required." },
      { status: 422 }
    );
  }

  try {
    const result = dataStore.moderateReport({
      reportId: params.id,
      action,
      status,
      reason: sanitizeInput(reason),
      moderatorId,
    });

    if (!result) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ report: result.report, log: result.log });
  } catch (err) {
    console.error("PATCH /api/v1/reports/[id] error:", err);
    return NextResponse.json({ error: "Failed to update report." }, { status: 500 });
  }
}
