import { NextRequest, NextResponse } from "next/server";
import { createReportSchema, reportsQuerySchema } from "@/lib/validation";
import { applyRateLimit, getAnonFingerprint, RATE_LIMITS } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";
import { dataStore } from "@/lib/data-store";
import { getCurrentUser } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";

// GET /api/v1/reports — list reports with filters & proximity
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryResult = reportsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", details: queryResult.error.flatten() },
      { status: 400 }
    );
  }

  const { lat, lng, radiusKm, category, status, sort, page, limit } = queryResult.data;
  const search = searchParams.get("search") || undefined;
  const reporterId = searchParams.get("reporterId") || undefined;

  try {
    const result = dataStore.getReports({
      lat,
      lng,
      radiusKm,
      category,
      status,
      sort,
      search,
      reporterId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/v1/reports error:", err);
    return NextResponse.json({ error: "Failed to fetch reports." }, { status: 500 });
  }
}

// POST /api/v1/reports — create a new report
export async function POST(request: NextRequest) {
  // Authentication required to submit reports
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Authentication required. You must sign in to submit a hazard report." },
      { status: 401 }
    );
  }
  if (currentUser.status === "suspended") {
    return NextResponse.json(
      { error: "Your account is currently suspended from submitting reports." },
      { status: 403 }
    );
  }

  // Rate limiting for authenticated submissions
  const rateLimitError = applyRateLimit(request, RATE_LIMITS.anonReport);
  if (rateLimitError) return rateLimitError;

  let body: any;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const entries: [string, any][] = [];
      form.forEach((value, key) => {
        if (typeof value === "string") entries.push([key, value]);
      });
      body = Object.fromEntries(entries);
      body.latitude = parseFloat(body.latitude);
      body.longitude = parseFloat(body.longitude);
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Sanitize text fields to prevent XSS
  const sanitized = {
    ...data,
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    publicLocationDesc: data.publicLocationDesc ? sanitizeInput(data.publicLocationDesc) : undefined,
    nearbyLandmark: data.nearbyLandmark ? sanitizeInput(data.nearbyLandmark) : undefined,
  };

  // Duplicate detection
  const duplicates = dataStore.findDuplicateCandidates({
    latitude: sanitized.latitude,
    longitude: sanitized.longitude,
    category: sanitized.category,
    title: sanitized.title,
    radiusKm: 1.0,
  });

  const likelyDuplicate = duplicates.length > 0 && duplicates[0].distanceKm < 0.5 ? duplicates[0] : null;

  // Create report
  const fingerprint = getAnonFingerprint(request);

  try {
    const newReport = dataStore.createReport({
      reporterId: currentUser.id,
      title: sanitized.title,
      description: sanitized.description,
      category: sanitized.category,
      latitude: sanitized.latitude,
      longitude: sanitized.longitude,
      publicLocationDesc: sanitized.publicLocationDesc,
      nearbyLandmark: sanitized.nearbyLandmark,
      anonFingerprint: fingerprint,
      observedAt: sanitized.observedAt,
      expectedResolutionAt: sanitized.expectedResolutionAt,
      coverPhoto: sanitized.coverPhoto || (sanitized.coverPhotoId ? { id: sanitized.coverPhotoId, publicUrl: `/uploads/${sanitized.coverPhotoId}` } : null),
    });

    // Gamification: Award 25 Civic Points (+10 if photo attached) and dynamic badge evaluation
    const pointsBonus = sanitized.coverPhoto || sanitized.coverPhotoId ? 35 : 25;
    userStore.incrementReports(currentUser.id, pointsBonus, sanitized.category);

    return NextResponse.json(
      {
        report: newReport,
        pointsEarned: pointsBonus,
        duplicateWarning: likelyDuplicate
          ? {
              message: "A similar hazard report exists nearby.",
              candidate: likelyDuplicate,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/v1/reports error:", err);
    return NextResponse.json({ error: "Failed to create report." }, { status: 500 });
  }
}
