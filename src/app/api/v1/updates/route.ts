import { NextRequest, NextResponse } from "next/server";
import { createUpdateSchema } from "@/lib/validation";
import { applyRateLimit, getAnonFingerprint, RATE_LIMITS } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { dataStore } from "@/lib/data-store";

// POST /api/v1/updates — add a community update to a hazard
export async function POST(request: NextRequest) {
  const rateLimitError = applyRateLimit(request, RATE_LIMITS.anonUpdate);
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { reportId, updateType, description } = parsed.data;
  const fingerprint = getAnonFingerprint(request);

  const update = dataStore.addUpdate({
    reportId,
    updateType,
    description: sanitizeInput(description),
    anonFingerprint: fingerprint,
  });

  if (!update) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, update }, { status: 201 });
}
