"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Shield, User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const { locale, t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(locale === "bn" ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      const isSafeRedirect =
        redirectTarget &&
        redirectTarget.startsWith("/") &&
        !redirectTarget.startsWith("//") &&
        !redirectTarget.includes(":");

      router.push(isSafeRedirect ? redirectTarget : "/dashboard");
    } else {
      setError(res.error || (locale === "bn" ? "রেজিস্ট্রেশন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।" : "Registration failed. Please check inputs."));
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
          {locale === "bn" ? "নতুন নাগরিক অ্যাকাউন্ট খুলুন" : "Create Citizen Account"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {locale === "bn"
            ? "আপনার এলাকার হ্যাজার্ড ট্র্যাক করতে ও কমিউনিটি তথ্যের সত্যতা যাচাইয়ে অবদান রাখুন।"
            : "Contribute to verified neighborhood safety updates. Free and privacy-first."}
        </p>
      </div>

      {redirectTarget && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {locale === "bn"
              ? "অ্যাকাউন্ট তৈরি সম্পন্ন হলে সরাসরি রিপোর্ট জমা দেওয়ার পাতায় নিয়ে যাওয়া হবে।"
              : "After registration, you will be redirected to submit your hazard report."}
          </span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
            {locale === "bn" ? "আপনার নাম" : "Full Name"}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "bn" ? "যেমন: তানভীর আহমেদ" : "e.g. Tanvir Ahmed"}
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
        </div>

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
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
            {locale === "bn" ? "পাসওয়ার্ড" : "Password"}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              minLength={8}
              required
            />
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {locale === "bn" ? "ন্যূনতম ৮টি অক্ষর প্রয়োজন" : "Minimum 8 characters required"}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
            {locale === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            <span>{locale === "bn" ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "Creating Account..."}</span>
          ) : (
            <>
              <span>{locale === "bn" ? "নিবন্ধন সম্পন্ন করুন" : "Complete Registration"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-gray-500">
        <span>{locale === "bn" ? "ইতিমধ্যে অ্যাকাউন্ট আছে? " : "Already have an account? "}</span>
        <Link
          href={`/auth/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
          className="font-bold text-teal-700 hover:text-teal-900 underline"
        >
          {locale === "bn" ? "সাইন ইন করুন" : "Sign In"}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-xs text-gray-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
