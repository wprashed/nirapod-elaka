import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { userStore } from "@/lib/user-store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/security";
import { sanitizeInput } from "@/lib/sanitize";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255)
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  // Rate limit registration attempts: max 10 per hour per IP
  const rateLimitError = applyRateLimit(request, {
    prefix: "auth:register",
    limit: 10,
    windowSeconds: 3600,
  });
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors.map((e) => e.message).join(", ");
    return NextResponse.json({ error: errorDetails }, { status: 422 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = userStore.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const cleanName = sanitizeInput(name);
    const user = userStore.createUser({
      name: cleanName,
      email,
      password,
      role: "user",
    });

    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only secure cookie
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
    console.error("Register error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account." },
      { status: 500 }
    );
  }
}
