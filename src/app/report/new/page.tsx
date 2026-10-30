"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ReportCategory } from "@/lib/types";
import { REPORT_CATEGORIES } from "@/lib/validation";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import {
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Clock,
  Eye,
  FileText,
  ShieldCheck,
  Compass,
  Lock,
  Sparkles,
} from "lucide-react";

const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse text-xs">
        মানচিত্র প্রস্তুত হচ্ছে...
      </div>
    ),
  }
);

export default function NewReportPage() {
  const { locale, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form State
  const [category, setCategory] = useState<ReportCategory>("waterlogging");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number>(23.8103);
  const [longitude, setLongitude] = useState<number>(90.4125);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [publicLocationDesc, setPublicLocationDesc] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [observedAt, setObservedAt] = useState<string>("");
  const [expectedDuration, setExpectedDuration] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Flow State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<any | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  // Item 14 & 15: Clamp coordinates for privacy and auto reverse-geocode
  const handleLocationSelect = (lat: number, lng: number) => {
    const clampedLat = Math.round(lat * 10000) / 10000;
    const clampedLng = Math.round(lng * 10000) / 10000;
    setLatitude(clampedLat);
    setLongitude(clampedLng);
    setHasSelectedLocation(true);
    checkDuplicates(clampedLat, clampedLng, category, title);

    // Item 15: Reverse geocoding via cached internal proxy
    try {
      fetch(`/api/v1/geocode/reverse?lat=${clampedLat}&lng=${clampedLng}&lang=${locale}`)
        .then((res) => res.json())
        .then((geo) => {
          if (geo && geo.address && !publicLocationDesc) {
            setPublicLocationDesc(geo.address);
          }
        })
        .catch(() => {});
    } catch {
      // Ignore geocoding failure gracefully
    }
  };

  // Item 19: Client-side image downsampling and WebP compression
  const compressImageClient = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1280;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                    type: "image/webp",
                  })
                );
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.82
          );
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError(locale === "bn" ? "ছবির সাইজ ৮ MB এর বেশি হতে পারবে না।" : "Photo must be less than 8 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(locale === "bn" ? "শুধুমাত্র JPG, PNG বা WebP ছবি গ্রহণযোগ্য।" : "Only JPG, PNG, and WebP formats are allowed.");
      return;
    }

    const compressed = await compressImageClient(file);
    setPhotoFile(compressed);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(compressed);
    setError(null);
  };

  const checkDuplicates = async (lat: number, lng: number, cat: ReportCategory, currentTitle: string) => {
    if (!currentTitle || currentTitle.length < 4) return;
    try {
      const res = await fetch(`/api/v1/reports?lat=${lat}&lng=${lng}&radiusKm=1&category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          setDuplicateWarning(data.reports[0]);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const validateForm = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError(locale === "bn" ? "শিরোনামটি ন্যূনতম ৫ অক্ষরের হতে হবে।" : "Title must be at least 5 characters.");
      return false;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError(locale === "bn" ? "বিবরণটি ন্যূনতম ১০ অক্ষরের হতে হবে।" : "Description must be at least 10 characters.");
      return false;
    }
    if (!hasSelectedLocation) {
      setError(locale === "bn" ? "অনুগ্রহ করে মানচিত্রে পিন ফেলে অবস্থান চিহ্নিত করুন।" : "Please select the hazard location on the map.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreviewModal(true);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let uploadedPhotoUrl = null;

      // Upload photo if present
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/v1/uploads", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const upErr = await uploadRes.json().catch(() => ({}));
          throw new Error(
            upErr.error ||
              (locale === "bn"
                ? "ছবি আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
                : "Photo upload failed. Please try again.")
          );
        }
        const upData = await uploadRes.json();
        uploadedPhotoUrl = upData.publicUrl;
      }

      // Submit Report (Item 10: wire expectedDuration)
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          latitude,
          longitude,
          publicLocationDesc: publicLocationDesc.trim() || undefined,
          nearbyLandmark: nearbyLandmark.trim() || undefined,
          observedAt: observedAt || undefined,
          expectedResolutionAt: expectedDuration
            ? new Date(Date.now() + parseFloat(expectedDuration) * 3600000).toISOString()
            : undefined,
          coverPhoto: uploadedPhotoUrl ? { id: "photo-new", publicUrl: uploadedPhotoUrl } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setCreatedReport(data.report);
      setShowPreviewModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
      setShowPreviewModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (createdReport) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-black text-gray-900">
            {t("report.successTitle", "রিপোর্ট জমা হয়েছে!")}
          </h1>

          {/* Gamification reward pill */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>{locale === "bn" ? "+২৫ নাগরিক পয়েন্ট (Civic Points) যোগ হয়েছে!" : "+25 Civic Points earned!"}</span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            {t(
              "report.successMessage",
              "আপনার কমিউনিটিকে সাহায্য করার জন্য ধন্যবাদ। আপনার রিপোর্টটি প্ল্যাটফর্মে প্রকাশিত হয়েছে এবং কমিউনিটি ও মডারেশনের মাধ্যমে পর্যবেক্ষণ করা হবে।"
            )}
          </p>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-1.5 my-4">
            <div className="font-bold text-gray-900 text-sm">{createdReport.title}</div>
            <div className="text-teal-700 font-semibold">{CATEGORY_META[createdReport.category as ReportCategory]?.labelBn}</div>
            {createdReport.publicLocationDesc && (
              <div className="text-gray-600">📍 {createdReport.publicLocationDesc}</div>
            )}
            <div className="text-gray-400 text-[11px] pt-1 border-t border-gray-200">
              ID: {createdReport.id}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/report/${createdReport.id}`}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition"
            >
              {t("report.viewReport", "রিপোর্টটি দেখুন")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedReport(null);
                setTitle("");
                setDescription("");
                setHasSelectedLocation(false);
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition"
            >
              {t("report.submitAnother", "আরেকটি রিপোর্ট করুন")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Must be logged in to report a hazard
  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-amber-700" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">
            {locale === "bn" ? "রিপোর্ট করতে সাইন ইন আবশ্যক" : "Sign In Required to Report"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {locale === "bn"
              ? "নাগরিক তথ্যের নিরাপত্তা ও নির্ভরযোগ্যতা নিশ্চিত করতে হ্যাজার্ড রিপোর্ট পোস্ট করতে অ্যাকাউন্টে লগইন থাকা প্রয়োজন। প্রতিটি সঠিক রিপোর্টের মাধ্যমে আপনি নাগরিক পয়েন্ট ও ব্যাজ অর্জন করবেন।"
              : "To maintain community safety and prevent misinformation, reporting a hazard requires an account. Earn civic reputation points and badges for keeping neighbors informed."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/auth/login?redirect=/report/new"
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{locale === "bn" ? "সাইন ইন করুন" : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/register?redirect=/report/new"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center"
          >
            <span>{locale === "bn" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "Create Account"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t("report.newTitle", "হ্যাজার্ড ও বিঘ্ন রিপোর্ট করুন")}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {locale === "bn"
            ? "আপনার এলাকার জলাবদ্ধতা, ভাঙা রাস্তা বা বিপজ্জনক পরিস্থিতি জানিয়ে সহনাগরিকদের সতর্ক করুন এবং নাগরিক পয়েন্ট অর্জন করুন।"
            : "Report flooding, damaged streets, or local disruptions to keep neighbors safe and earn civic points."}
        </p>
      </div>

      {/* Gamification perk banner */}
      <div className="p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            {locale === "bn"
              ? "এই রিপোর্টটি জমা দিলে আপনি ২৫টি নাগরিক পয়েন্ট (Civic Points) অর্জন করবেন!"
              : "Submitting this verified hazard earns you +25 Civic Reputation Points!"}
          </span>
        </div>
        <span className="font-bold text-teal-700 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs shrink-0">
          +25 pts
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Alert Card */}
      {duplicateWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-bold block">
                {locale === "bn" ? "এই এলাকায় ইতিমধ্যে একটি অনুরূপ রিপোর্ট রয়েছে!" : "A similar hazard report exists nearby!"}
              </span>
              <span className="text-xs text-amber-800">
                "{duplicateWarning.title}" — {duplicateWarning.publicLocationDesc || "Nearby"}
              </span>
            </div>
          </div>
          <Link
            href={`/report/${duplicateWarning.id}`}
            className="shrink-0 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold"
          >
            {locale === "bn" ? "বিদ্যমান রিপোর্ট দেখুন" : "View Existing Report"}
          </Link>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleOpenPreview} className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Category Picker */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            {locale === "bn" ? "১. হ্যাজার্ডের ধরন নির্বাচন করুন *" : "1. Select Hazard Category *"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {REPORT_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (hasSelectedLocation) checkDuplicates(latitude, longitude, cat, title);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-semibold transition ${
                    isSelected
                      ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20 shadow-xs"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="text-xl" role="img" aria-hidden="true">{meta.icon}</span>
                  <span className="leading-snug">{locale === "bn" ? meta.labelBn : meta.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Short Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              {locale === "bn" ? "২. সংক্ষিপ্ত শিরোনাম *" : "2. Short Title *"}
            </label>
            <span className="text-[11px] text-gray-400">{title.length} / 200</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (hasSelectedLocation) checkDuplicates(latitude, longitude, category, e.target.value);
            }}
            placeholder={
              locale === "bn"
                ? "যেমন: মিরপুর রোডে কোমর সমান জলাবদ্ধতা"
                : "e.g. Deep waterlogging on Mirpur Road near Dhanmondi 27"
            }
            maxLength={200}
            className="w-full text-xs sm:text-sm rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              {locale === "bn" ? "৩. বিস্তারিত বিবরণ *" : "3. Detailed Description *"}
            </label>
            <span className="text-[11px] text-gray-400">{description.length} / 2000</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={
              locale === "bn"
                ? "পরিস্থিতি বর্ণনা করুন: পানি কতটা উঠেছে? কোন কোন যানবাহন চলাচল করতে পারছে না? পথচারীদের জন্য কি বিকল্প রাস্তা আছে?"
                : "Describe the hazard: What is the extent? Are vehicles stranded? Can pedestrians pass safely? Any alternative route?"
            }
            maxLength={2000}
            className="w-full text-xs sm:text-sm rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed"
            required
          />
        </div>

        {/* Location Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              {locale === "bn" ? "৪. মানচিত্রে সঠিক স্থান চিহ্নিত করুন *" : "4. Select Exact Location on Map *"}
            </label>
            {hasSelectedLocation && (
              <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === "bn" ? "স্থান নির্বাচিত" : "Location Set"}
              </span>
            )}
          </div>

          <MapView
            selectableLocation={true}
            selectedLocation={hasSelectedLocation ? [latitude, longitude] : null}
            onLocationSelect={handleLocationSelect}
            height="320px"
            zoom={13}
            center={[latitude, longitude]}
          />

          {/* Privacy Note for Geolocation */}
          <div className="mt-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              {locale === "bn"
                ? "প্রাইভেসি নিরাপত্তা: আপনার কোনো ব্যক্তিগত ট্র্যাকিং করা হবে না। রিপোর্টটি কেবল সাধারণ জনগণের সুবিধার জন্য পাবলিক পয়েন্ট হিসেবে ব্যবহৃত হবে।"
                : "Privacy guarantee: Location is strictly used to display this neighborhood disruption. We never track your personal movements or expose home addresses."}
            </span>
          </div>

          {/* Landmark & Public Location Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === "bn" ? "পাবলিক এলাকার নাম" : "Public Area / Road Name"}
              </label>
              <input
                type="text"
                value={publicLocationDesc}
                onChange={(e) => setPublicLocationDesc(e.target.value)}
                placeholder={locale === "bn" ? "যেমন: ধানমন্ডি ২৭ মোড়" : "e.g. Dhanmondi 27 intersection"}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === "bn" ? "নিকটবর্তী ল্যান্ডমার্ক (ঐচ্ছিক)" : "Nearby Landmark (Optional)"}
              </label>
              <input
                type="text"
                value={nearbyLandmark}
                onChange={(e) => setNearbyLandmark(e.target.value)}
                placeholder={locale === "bn" ? "যেমন: রাপা প্লাজার সামনে" : "e.g. In front of Rapa Plaza"}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Timing & Expected Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === "bn" ? "কখন দেখেছেন? (ঐচ্ছিক)" : "Observed Time (Optional)"}
              </label>
              <input
                type="datetime-local"
                value={observedAt ? observedAt.slice(0, 16) : ""}
                onChange={(e) => setObservedAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                max={new Date().toISOString().slice(0, 16)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === "bn" ? "আনুমানিক সময়কাল / কতক্ষণ থাকতে পারে?" : "Expected Duration (Optional)"}
              </label>
              <select
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{locale === "bn" ? "অজানা / অনুমান করা যাচ্ছে না" : "Unknown / Not sure"}</option>
                <option value="1">{locale === "bn" ? "~ ১ ঘণ্টা" : "~ 1 hour"}</option>
                <option value="3">{locale === "bn" ? "~ ৩ ঘণ্টা" : "~ 3 hours"}</option>
                <option value="6">{locale === "bn" ? "~ ৬ ঘণ্টা (বেশ কিছুক্ষণ)" : "~ 6 hours"}</option>
                <option value="24">{locale === "bn" ? "~ ১ দিন বা তার বেশি" : "~ 1 day or more"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Photo Upload with Strict Civic Protection Notice */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
            {locale === "bn" ? "৫. পরিস্থিতি সম্পর্কিত ছবি (ঐচ্ছিক)" : "5. Hazard Photo (Optional)"}
          </label>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 mb-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              {locale === "bn"
                ? "⚠️ গুরুত্বপূর্ণ: মানুষের মুখমণ্ডল, গাড়ির নম্বরপ্লেট, জাতীয় পরিচয়পত্র বা ব্যক্তিগত পরিচয়যুক্ত ছবি আপলোড করবেন না।"
                : "⚠️ Notice: Do not upload images showing recognizable faces, license plates, identity cards, or private documents."}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 hover:border-teal-500 hover:bg-teal-50 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer flex items-center justify-center gap-2 transition">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>{locale === "bn" ? "ছবি নির্বাচন করুন (সর্বোচ্চ ৫ MB)" : "Choose Photo (Max 5 MB)"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            {photoFile && (
              <span className="text-xs text-teal-700 font-medium truncate max-w-xs">
                ✓ {photoFile.name} ({(photoFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </div>

          {photoPreview && (
            <div className="mt-3 relative w-48 h-32 rounded-xl overflow-hidden border border-gray-200">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            {locale === "bn" ? "বাতিল" : "Cancel"}
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-md transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>{locale === "bn" ? "প্রিভিউ দেখুন ও নিশ্চিত করুন" : "Preview & Submit"}</span>
          </button>
        </div>
      </form>

      {/* Submission Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-lg text-gray-900">
              {locale === "bn" ? "রিপোর্ট প্রিভিউ (যাচাই করুন)" : "Report Preview"}
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CATEGORY_META[category]?.icon}</span>
                  <span className="font-bold text-teal-800">
                    {locale === "bn" ? CATEGORY_META[category]?.labelBn : CATEGORY_META[category]?.labelEn}
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-base">{title}</div>
                <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                {publicLocationDesc && (
                  <div className="text-gray-600 font-medium">📍 {publicLocationDesc}</div>
                )}
                {nearbyLandmark && (
                  <div className="text-gray-500 text-xs">Landmark: {nearbyLandmark}</div>
                )}
                <div className="text-gray-400 text-[11px]">
                  Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              </div>

              {photoPreview && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">Attached Photo:</span>
                  <img src={photoPreview} alt="Attached" className="w-full h-40 object-cover rounded-xl border" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                {locale === "bn" ? "পরিবর্তন করুন" : "Edit"}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <span>{locale === "bn" ? "জমা হচ্ছে..." : "Submitting..."}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === "bn" ? "চূড়ান্ত জমা দিন" : "Confirm & Submit"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
