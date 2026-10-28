import { NextRequest, NextResponse } from "next/server";
import { userStore } from "@/lib/user-store";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/v1/auth/reset-password
export async function POST(request: NextRequest) {
  const rateLimitError = applyRateLimit(request, {
    prefix: "auth:reset",
    limit: 5,
    windowSeconds: 900,
  });
  if (rateLimitError) return rateLimitError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { action, email, token, newPassword } = body;

  if (action === "request_token") {
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 422 });
    }

    const resetToken = userStore.generatePasswordResetToken(email);

    // In production, send via transactional email. In dev/demo, return token for instant testing.
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset token has been issued.",
      demoResetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } else if (action === "execute_reset") {
    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Valid reset token and new password (min 8 characters) are required." },
        { status: 422 }
      );
    }

    const success = userStore.resetPasswordWithToken(token, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please sign in with your new password.",
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 422 });
}
