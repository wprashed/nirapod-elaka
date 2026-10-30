import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth-helpers";
import { userStore } from "@/lib/user-store";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    userStore.revokeUserSession(currentUser.id);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
