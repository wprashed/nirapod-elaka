import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { userStore } from "@/lib/user-store";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/security";
import { applyRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  // Anti-Brute-Force Rate limit: max 8 attempts per 10 minutes per IP
  const rateLimitError = applyRateLimit(request, {
    prefix: "auth:login",
    limit: 8,
    windowSeconds: 600,
  });
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password." },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = userStore.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        {
          error: `This account has been suspended. Reason: ${
            user.suspendedReason || "Violation of civic platform terms."
          }`,
        },
        { status: 403 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
