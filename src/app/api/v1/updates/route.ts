import { NextRequest, NextResponse } from "next/server";
import { createUpdateSchema } from "@/lib/validation";
import { applyRateLimit, getAnonFingerprint, RATE_LIMITS } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { dataStore } from "@/lib/data-store";
import { requireAuth, isAuthError } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";

// POST /api/v1/updates — add a community update to a hazard
export async function POST(request: NextRequest) {
  // Authentication required to submit community updates
  const currentUser = await requireAuth();
  if (isAuthError(currentUser)) return currentUser;

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

  const { reportId, updateType, description, photoUrl } = parsed.data;
  const fingerprint = getAnonFingerprint(request);

  const update = dataStore.addUpdate({
    reportId,
    updateType,
    description: sanitizeInput(description),
    photoUrl: photoUrl ? sanitizeInput(photoUrl) : null,
    contributorId: currentUser.id,
    anonFingerprint: fingerprint,
  });

  if (!update) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  // Gamification: Award 15 Civic Points for on-the-ground updates & evaluate badges
  userStore.incrementUpdatesCount(currentUser.id, 15);

  return NextResponse.json({ success: true, update, pointsEarned: 15 }, { status: 201 });
}
