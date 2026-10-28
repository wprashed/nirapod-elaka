"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck, ShieldAlert, Check } from "lucide-react";

export default function LoginPage() {
  const { locale, t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();

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
      // Determine redirection
      if (email.includes("admin")) {
        router.push("/admin");
      } else if (email.includes("moderator")) {
        router.push("/moderation");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(res.error || "Login failed. Please verify your credentials.");
    }
  };

  const fillDemoCreds = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
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
            ? "আপনার রিপোর্ট, নোটিশ ও মডারেশন কার্যক্রম পরিচালনা করতে প্রবেশ করুন।"
            : "Sign in to manage your reports, moderation duties, or admin privileges."}
        </p>
      </div>

      {/* Demo Credentials Quick-Fill Cards */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200/80 rounded-3xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 uppercase tracking-wide">
          <UserCheck className="w-4 h-4 text-teal-600" />
          <span>{locale === "bn" ? "টেস্টিং অ্যাকাউন্ট (এক ক্লিকে পূরণ করুন)" : "Quick Test Accounts (Click to Fill)"}</span>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillDemoCreds("admin@nirapod.local", "Admin@123456")}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-teal-100/50 border border-teal-200/60 text-left transition group shadow-2xs"
          >
            <div>
              <span className="font-bold text-gray-900 block group-hover:text-teal-900">
                👑 {locale === "bn" ? "সিস্টেম অ্যাডমিনিস্ট্রেটর" : "System Admin"}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">admin@nirapod.local</span>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Fill
            </span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoCreds("moderator@nirapod.local", "Mod@123456")}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-teal-100/50 border border-teal-200/60 text-left transition group shadow-2xs"
          >
            <div>
              <span className="font-bold text-gray-900 block group-hover:text-teal-900">
                🛡️ {locale === "bn" ? "কমিউনিটি মডারেটর" : "City Moderator"}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">moderator@nirapod.local</span>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Fill
            </span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoCreds("user@nirapod.local", "User@123456")}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-teal-100/50 border border-teal-200/60 text-left transition group shadow-2xs"
          >
            <div>
              <span className="font-bold text-gray-900 block group-hover:text-teal-900">
                👤 {locale === "bn" ? "সাধারণ নাগরিক (Tanvir Ahmed)" : "Verified Commuter"}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">user@nirapod.local</span>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Fill
            </span>
          </button>
        </div>
      </div>

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

        <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>{locale === "bn" ? "কোনো অ্যাকাউন্ট নেই?" : "Don't have an account?"} </span>
          <Link href="/auth/register" className="font-bold text-teal-700 hover:text-teal-900 underline">
            {locale === "bn" ? "বিনামূল্যে নিবন্ধন করুন" : "Register here"}
          </Link>
        </div>
      </form>
    </div>
  );
}
