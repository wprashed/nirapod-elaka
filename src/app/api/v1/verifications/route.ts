import { NextRequest, NextResponse } from "next/server";
import { verificationSchema } from "@/lib/validation";
import { applyRateLimit, getAnonFingerprint, RATE_LIMITS } from "@/lib/rate-limit";
import { dataStore } from "@/lib/data-store";

// POST /api/v1/verifications — submit a community verification (confirm/dispute/resolve)
export async function POST(request: NextRequest) {
  const rateLimitError = applyRateLimit(request, RATE_LIMITS.anonVerify);
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = verificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { reportId, result } = parsed.data;
  const fingerprint = getAnonFingerprint(request);

  const res = dataStore.addVerification({
    reportId,
    result,
    anonFingerprint: fingerprint,
  });

  if (!res) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (res.alreadyVerified) {
    return NextResponse.json(
      {
        error: "You have already submitted a verification vote for this hazard report.",
        report: res.report,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, report: res.report, event: res.event });
}
