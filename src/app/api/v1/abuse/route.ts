import { NextRequest, NextResponse } from "next/server";
import { abuseReportSchema } from "@/lib/validation";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { dataStore } from "@/lib/data-store";

// POST /api/v1/abuse — submit an abuse report for spam or unsafe content
export async function POST(request: NextRequest) {
  const rateLimitError = applyRateLimit(request, RATE_LIMITS.anonAbuse);
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = abuseReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { targetReportId, targetUpdateId, reason, details } = parsed.data;

  const item = dataStore.addAbuseReport({
    targetReportId,
    targetUpdateId,
    reason: sanitizeInput(reason),
    details: details ? sanitizeInput(details) : undefined,
  });

  return NextResponse.json({ success: true, abuseReport: item }, { status: 201 });
}
