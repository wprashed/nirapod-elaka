"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, AlertCircle, CheckCheck, X, ThumbsUp, Sparkles } from "lucide-react";

interface VerifyModalProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReport: any) => void;
}

export function VerifyModal({
  reportId,
  reportTitle,
  isOpen,
  onClose,
  onSuccess,
}: VerifyModalProps) {
  const { locale, t } = useI18n();
  const { user, refreshUser } = useAuth();
  const [selectedAction, setSelectedAction] = useState<"confirm" | "dispute" | "resolved">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      const res = await fetch("/api/v1/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          result: selectedAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit verification");
      }

      if (user) {
        refreshUser();
      }

      onSuccess(data.report);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
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

        <h3 id="verify-modal-title" className="font-bold text-lg text-gray-900 mb-1">
          {locale === "bn" ? "কমিউনিটি যাচাইকরণ" : "Community Verification"}
        </h3>
        <p className="text-xs text-gray-600 mb-4 line-clamp-1 italic">"{reportTitle}"</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Option: Still happening */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              selectedAction === "confirm"
                ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="action"
              checked={selectedAction === "confirm"}
              onChange={() => setSelectedAction("confirm")}
              className="mt-1 text-teal-600 focus:ring-teal-500"
            />
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{locale === "bn" ? "হ্যাঁ, এখনও চলছে (নিশ্চিত করুন)" : "Still happening (Confirm)"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "bn"
                  ? "আপনি নিজে দেখেছেন বা জেনেছেন যে সমস্যাটি এখনও বিদ্যমান।"
                  : "You observed that the disruption is still present on the ground."}
              </p>
            </div>
          </label>

          {/* Option: Resolved */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              selectedAction === "resolved"
                ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="action"
              checked={selectedAction === "resolved"}
              onChange={() => setSelectedAction("resolved")}
              className="mt-1 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>{locale === "bn" ? "সমাধান হয়েছে (রাস্তা পরিষ্কার)" : "Resolved (Cleared)"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "bn"
                  ? "পানি নেমে গেছে বা রাস্তা সম্পূর্ণ উন্মুক্ত করা হয়েছে।"
                  : "The obstacle has been removed or water has completely drained."}
              </p>
            </div>
          </label>

          {/* Option: Dispute */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              selectedAction === "dispute"
                ? "border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="action"
              checked={selectedAction === "dispute"}
              onChange={() => setSelectedAction("dispute")}
              className="mt-1 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{locale === "bn" ? "তথ্যটি ভুল বা অতিরঞ্জিত" : "Information is incorrect"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "bn"
                  ? "এই স্থানে কোনো সমস্যা নেই বা তথ্য বিভ্রান্তিকর।"
                  : "There is no hazard at this location or the description is inaccurate."}
              </p>
            </div>
          </label>

          {/* Points incentive notice */}
          {user && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                {locale === "bn" ? "ভেরিফিকেশন সম্পন্ন করলে অর্জিত হবে:" : "Points earned for verification:"}
              </span>
              <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                +১০ pts
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs transition disabled:opacity-50"
            >
              {loading ? (locale === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (locale === "bn" ? "জমা দিন" : "Submit Verification")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
