"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

function LoginForm() {
  const { locale, t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (email.includes("admin")) {
        router.push("/admin");
      } else if (email.includes("moderator")) {
        router.push("/moderation");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(
        res.error ||
          (locale === "bn"
            ? "লগইন ব্যর্থ হয়েছে। ইমেল এবং পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।"
            : "Login failed. Please verify your email and password.")
      );
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {locale === "bn" ? "নিরাপদ এলাকায় সাইন ইন" : "Sign In to NirapodElaka"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {locale === "bn"
            ? "আপনার রিপোর্ট, নোটিশ ও নাগরিক সেবা পরিচালনা করতে প্রবেশ করুন।"
            : "Sign in to report hazards, track status, and view your civic reputation."}
        </p>
      </div>

      {redirectTarget && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {locale === "bn"
              ? "হ্যাজার্ড রিপোর্ট পোস্ট করতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।"
              : "Please sign in to your account to submit a hazard report."}
          </span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
            {locale === "bn" ? "ইমেইল ঠিকানা" : "Email Address"}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">
              {locale === "bn" ? "পাসওয়ার্ড" : "Password"}
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900"
            >
              {locale === "bn" ? "ভুলে গেছেন?" : "Forgot password?"}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>{locale === "bn" ? "যাচাই হচ্ছে..." : "Signing in..."}</span>
          ) : (
            <>
              <span>{locale === "bn" ? "সাইন ইন করুন" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Registration */}
      <div className="text-center text-xs text-gray-500">
        <span>{locale === "bn" ? "অ্যাকাউন্ট নেই? " : "Don't have an account? "}</span>
        <Link
          href={`/auth/register${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
          className="font-bold text-teal-700 hover:text-teal-900 underline"
        >
          {locale === "bn" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "Create an Account"}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-xs text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
