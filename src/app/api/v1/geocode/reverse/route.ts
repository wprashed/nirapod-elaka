import { NextRequest, NextResponse } from "next/server";

// Cache reverse-geocoded coordinates (100m grid) for 24 hours
const geoCache = new Map<string, { address: string; timestamp: number }>();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const lang = searchParams.get("lang") || "bn";

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Valid lat and lng required." }, { status: 400 });
  }

  // 100-meter grid cache key
  const gridKey = `${lat.toFixed(3)},${lng.toFixed(3)}:${lang}`;
  const cached = geoCache.get(gridKey);
  if (cached && Date.now() - cached.timestamp < 24 * 3600 * 1000) {
    return NextResponse.json({ address: cached.address, cached: true });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang === "bn" ? "bn,en" : "en"}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "NirapodElaka-CivicApp/1.0 (contact@nirapod.local; civic-hazard-reporting-bangladesh)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ address: null });
    }

    const data = await res.json();
    if (data && data.display_name) {
      const parts = data.display_name.split(", ");
      const address = parts.slice(0, 3).join(", ");
      geoCache.set(gridKey, { address, timestamp: Date.now() });
      return NextResponse.json({ address });
    }

    return NextResponse.json({ address: null });
  } catch {
    return NextResponse.json({ address: null });
  }
}
