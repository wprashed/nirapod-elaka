import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateRequestOrigin } from "@/lib/csrf";

const SESSION_COOKIE_NAME = "nirapod_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF validation for mutating API routes
  if (pathname.startsWith("/api/")) {
    const csrfError = validateRequestOrigin(request);
    if (csrfError) return csrfError;
    return NextResponse.next();
  }

  // 2. Route guards for protected pages
  const protectedRoutes = ["/admin", "/moderation", "/dashboard"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/moderation/:path*",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
