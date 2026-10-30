"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Flag, X, AlertTriangle } from "lucide-react";

interface AbuseModalProps {
  reportId?: string;
  updateId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AbuseModal({ reportId, updateId, isOpen, onClose }: AbuseModalProps) {
  const { locale } = useI18n();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetReportId: reportId,
          targetUpdateId: updateId,
          reason,
          details,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit abuse report");
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="abuse-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-rose-600">
          <Flag className="w-5 h-5" />
          <h3 id="abuse-modal-title" className="font-bold text-lg text-gray-900">
            {locale === "bn" ? "আপত্তিকর রিপোর্ট জমা দিন" : "Report Abuse or Spam"}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          {locale === "bn"
            ? "প্ল্যাটফর্মের স্বচ্ছতা বজায় রাখতে মডারেশন টিম প্রতিটি রিপোর্ট পর্যালোচনা করবে।"
            : "The moderation team will review this content against civic platform guidelines."}
        </p>

        {submitted ? (
          <div className="py-6 text-center text-teal-700 space-y-2">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="font-bold text-sm">
              {locale === "bn" ? "অভিযোগ গৃহীত হয়েছে!" : "Report Submitted"}
            </p>
            <p className="text-xs text-gray-500">
              {locale === "bn" ? "মডারেশন টিম এটি খতিয়ে দেখবে।" : "Thank you for keeping NirapodElaka safe."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {locale === "bn" ? "কারণে নির্বাচন করুন" : "Select Reason"}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs rounded-xl border-gray-300 border p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="spam">
                  {locale === "bn" ? "স্প্যাম বা ভুয়া রিপোর্ট" : "Spam or Fake Report"}
                </option>
                <option value="harassment">
                  {locale === "bn" ? "ব্যক্তিগত তথ্য বা মানহানিকর বক্তব্য" : "Personal Information / Defamation"}
                </option>
                <option value="inappropriate_photo">
                  {locale === "bn" ? "অনুপযুক্ত বা প্রাইভেসি লঙ্ঘনকারী ছবি" : "Inappropriate Photo"}
                </option>
                <option value="wrong_location">
                  {locale === "bn" ? "সম্পূর্ণ ভুল লোকেশন" : "Incorrect Location"}
                </option>
                <option value="duplicate">
                  {locale === "bn" ? "ডুপ্লিকেট রিপোর্ট" : "Duplicate Report"}
                </option>
                <option value="other">
                  {locale === "bn" ? "অন্যান্য" : "Other"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {locale === "bn" ? "অতিরিক্ত বিবরণ (ঐচ্ছিক)" : "Additional Details (Optional)"}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder={locale === "bn" ? "সমস্যাটি সংক্ষেপে লিখুন..." : "Describe the issue briefly..."}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                {locale === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition disabled:opacity-50"
              >
                {loading ? (locale === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (locale === "bn" ? "রিপোর্ট জমা দিন" : "Submit Report")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
