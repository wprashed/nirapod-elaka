import { NextRequest, NextResponse } from "next/server";

/**
 * Item 5: Origin / Referer Validation for State-Changing Requests.
 * Rejects cross-origin request forgery attempts from third-party sites.
 */
export function validateRequestOrigin(request: NextRequest): NextResponse | null {
  // Only state-changing verbs require origin inspection
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Cross-Origin Request Blocked by Civic Security Policy." },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Malformed Origin Header." },
        { status: 400 }
      );
    }
  }

  return null;
}
