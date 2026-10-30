import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

// POST /api/v1/cron/archive — scheduled retention worker
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!CRON_SECRET || CRON_SECRET.length < 16) {
      console.error("FATAL: CRON_SECRET must be set to at least 16 characters in production.");
      return NextResponse.json({ error: "Server misconfiguration: CRON_SECRET missing" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const devSecret = CRON_SECRET || "nirapod-internal-cron-key";
    if (authHeader !== `Bearer ${devSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { archivedCount } = dataStore.archiveStaleResolvedReports(30);

  return NextResponse.json({
    success: true,
    archivedCount,
    timestamp: new Date().toISOString(),
  });
}
