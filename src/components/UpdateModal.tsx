"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { MessageSquarePlus, X, AlertCircle, Sparkles } from "lucide-react";

interface UpdateModalProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUpdate: any) => void;
}

export function UpdateModal({
  reportId,
  reportTitle,
  isOpen,
  onClose,
  onSuccess,
}: UpdateModalProps) {
  const { locale } = useI18n();
  const { user, refreshUser } = useAuth();
  const [updateType, setUpdateType] = useState<
    "general" | "status_update" | "severity_change" | "partial_resolution" | "resolution"
  >("general");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError(locale === "bn" ? "ন্যূনতম ৫ অক্ষরের আপডেট বিবরণ লিখুন।" : "Please enter at least 5 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          updateType,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit update");
      }

      if (user) {
        refreshUser();
      }

      onSuccess(data.update);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1 text-teal-700">
          <MessageSquarePlus className="w-5 h-5" />
          <h3 className="font-bold text-lg text-gray-900">
            {locale === "bn" ? "নতুন কমিউনিটি আপডেট যোগ করুন" : "Add Community Update"}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4 line-clamp-1 italic">"{reportTitle}"</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {locale === "bn" ? "আপডেটের প্রকৃতি" : "Update Type"}
            </label>
            <select
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value as any)}
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="general">
                {locale === "bn" ? "সাধারণ পরিস্থিতি আপডেট" : "General Status Update"}
              </option>
              <option value="severity_change">
                {locale === "bn" ? "তীব্রতা হ্রাস বা বৃদ্ধি (যেমন: পানি কমেছে)" : "Severity Change (e.g. water receding)"}
              </option>
              <option value="partial_resolution">
                {locale === "bn" ? "আংশিক চলাচল স্বাভাবিক হয়েছে" : "Partial vehicular clearance"}
              </option>
              <option value="resolution">
                {locale === "bn" ? "সম্পূর্ণ সমাধান হয়েছে (বাধা অপসারিত)" : "Full resolution (hazard cleared)"}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {locale === "bn" ? "আপনার পর্যবেক্ষণ (৫-৫০০ অক্ষর)" : "Your Observation (5-500 characters)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                locale === "bn"
                  ? "যেমন: পানি নামতে শুরু করেছে, এক লেনে রিকশা ও বাস চলাচল করছে..."
                  : "e.g. Water level has decreased significantly, one lane is open for light vehicles..."
              }
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
              maxLength={500}
            />
            <div className="text-right text-[10px] text-gray-400 mt-1">
              {description.length} / 500
            </div>
          </div>

          {/* Points incentive notice */}
          {user && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                {locale === "bn" ? "আপডেট প্রদান করলে অর্জিত হবে:" : "Points earned for update:"}
              </span>
              <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                +১৫ pts
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
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
              {loading ? (locale === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (locale === "bn" ? "আপডেট জমা দিন" : "Submit Update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
