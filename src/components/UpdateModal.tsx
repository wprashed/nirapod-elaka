"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { MessageSquarePlus, X, AlertCircle, Sparkles, Camera } from "lucide-react";

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === "bn" ? "ছবির সাইজ ৫ MB এর কম হতে হবে।" : "Photo must be less than 5 MB.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError(locale === "bn" ? "ন্যূনতম ৫ অক্ষরের আপডেট বিবরণ লিখুন।" : "Please enter at least 5 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoUrl = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const upRes = await fetch("/api/v1/uploads", {
          method: "POST",
          body: formData,
        });
        if (!upRes.ok) {
          const upErr = await upRes.json().catch(() => ({}));
          throw new Error(upErr.error || "Failed to upload photo proof");
        }
        const upData = await upRes.json();
        photoUrl = upData.publicUrl;
      }

      const res = await fetch("/api/v1/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          updateType,
          description: description.trim(),
          photoUrl,
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 id="update-modal-title" className="font-bold text-gray-900 text-base leading-snug">
              {locale === "bn" ? "নতুন আপডেট দিন" : "Submit Community Update"}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[280px]">
              {reportTitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {locale === "bn" ? "আপডেটের ধরণ" : "Update Type"}
            </label>
            <select
              value={updateType}
              onChange={(e: any) => setUpdateType(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="general">
                {locale === "bn" ? "সাধারণ পরিস্থিতি আপডেট" : "General Status Update"}
              </option>
              <option value="severity_change">
                {locale === "bn" ? "ঝুঁকির মাত্রা পরিবর্তন (বৃদ্ধি/হ্রাস)" : "Severity Change (Worse / Better)"}
              </option>
              <option value="partial_resolution">
                {locale === "bn" ? "আংশিক সমাধান (এক লেনে চলাচল শুরু)" : "Partial clearance (one lane open)"}
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

          {/* Photo proof input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {locale === "bn" ? "ছবি প্রমাণ (ঐচ্ছিক)" : "Photo Proof (Optional)"}
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                <Camera className="w-4 h-4 text-teal-600" />
                <span>{photoFile ? (locale === "bn" ? "ছবি পরিবর্তন" : "Change Photo") : (locale === "bn" ? "ছবি তুলুন / আপলোড" : "Add Photo")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-0 right-0 bg-black/60 text-white rounded-bl text-[9px] p-0.5"
                  >
                    ×
                  </button>
                </div>
              )}
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
