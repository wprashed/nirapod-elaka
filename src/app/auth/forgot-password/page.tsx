"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Shield, Mail, Lock, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const { locale } = useI18n();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_token", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      if (data.demoResetToken) {
        setToken(data.demoResetToken);
      }
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_reset", token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      setStep("request");
      setEmail("");
      setToken("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {locale === "bn" ? "পাসওয়ার্ড পুনরুদ্ধার" : "Password Recovery"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {locale === "bn"
            ? "আপনার নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেট টোকেন গ্রহণ করুন।"
            : "Recover your citizen account credentials securely."}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            <span>{message}</span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
                {locale === "bn" ? "নিবন্ধিত ইমেইল" : "Registered Email"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@nirapod.local"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              {loading ? "Requesting..." : "Send Reset Instructions"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleExecuteReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token here"
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
                New Password (Min 8 Characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Save New Password"}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-gray-500">
          <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-900">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
