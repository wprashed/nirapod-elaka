import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

// POST /api/v1/cron/archive — scheduled retention worker
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET || "nirapod-internal-cron-key";

  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { archivedCount } = dataStore.archiveStaleResolvedReports(30);

  return NextResponse.json({
    success: true,
    archivedCount,
    timestamp: new Date().toISOString(),
  });
}
