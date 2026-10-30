"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ReportItem, ReportUpdateItem } from "@/lib/types";
import { CategoryBadge } from "@/components/CategoryBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { VerifyModal } from "@/components/VerifyModal";
import { UpdateModal } from "@/components/UpdateModal";
import { AbuseModal } from "@/components/AbuseModal";
import { formatTimestamp, isStale, toBengaliNumerals, getLocalizedReportText } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Flag,
  MessageSquarePlus,
  ThumbsUp,
  ShieldAlert,
  Info,
  CheckCheck,
  Newspaper,
  ExternalLink,
} from "lucide-react";

const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] rounded-2xl bg-gray-100 animate-pulse" />
    ),
  }
);

export default function ReportDetailPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAbuseModal, setShowAbuseModal] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/v1/reports/${id}`);
      if (!res.ok) {
        throw new Error(locale === "bn" ? "রিপোর্টটি খুঁজে পাওয়া যায়নি।" : "Report not found");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: report?.title || "NirapodElaka Hazard Alert",
          text: `${report?.title || "Hazard"} - ${report?.publicLocationDesc || "Dhaka"}`,
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return; // user cancelled share sheet
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-white rounded-3xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{error || "Report not found"}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === "bn" ? "হোমে ফিরে যান" : "Back to Home"}</span>
        </Link>
      </div>
    );
  }

  const createdTime = formatTimestamp(report.createdAt, locale);
  const confirmedTime = formatTimestamp(report.lastConfirmedAt, locale);
  const localized = getLocalizedReportText(report, locale);
  const stale = isStale(
    report.lastConfirmedAt ? new Date(report.lastConfirmedAt) : null,
    report.createdAt
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and share */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === "bn" ? "মানচিত্রে ফিরে যান" : "Back to Map"}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "শেয়ার" : "Share")}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAbuseModal(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Report abuse / spam"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.status} />
            {report.reporterId && (
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                👤 {locale === "bn" ? "যাচাইকৃত নাগরিক" : "Verified Citizen"}
              </span>
            )}
            {report.newsSource && (
              <a
                href={report.newsSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                title={locale === "bn" ? `সংবাদ প্রতিবেদন: ${report.newsSource.name}` : `News source: ${report.newsSource.name}`}
              >
                <Newspaper className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{report.newsSource.name}</span>
                <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
              </a>
            )}
          </div>

          <div className="text-[11px] text-gray-400 font-mono">
            ID: {report.id}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-3">
            {localized.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {localized.description}
          </p>
        </div>

        {/* Newspaper Source Callout */}
        {report.newsSource && (
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/90 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
              <Newspaper className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-blue-950 flex items-center gap-2">
                <span>{locale === "bn" ? "সংবাদপত্র সূত্র দ্বারা যাচাইকৃত" : "Verified Newspaper Report"}</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-200/60 text-blue-900 rounded-md font-semibold">
                  {report.newsSource.name}
                </span>
              </div>
              <p className="text-blue-900/80 leading-relaxed">
                {locale === "bn"
                  ? `এই বিঘ্নটির তথ্য বাংলাদেশের জাতীয় সংবাদমাধ্যম "${report.newsSource.name}"-এ প্রকাশিত মাঠপর্যায়ের রিপোর্টের ভিত্তিতে প্ল্যাটফর্মে যুক্ত ও যাচাই করা হয়েছে।`
                  : `This incident was sourced and verified from investigative field reporting published by "${report.newsSource.name}".`}
              </p>
              <div className="pt-1">
                <a
                  href={report.newsSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold underline text-[11px]"
                >
                  <span>{locale === "bn" ? "অনলাইন প্রতিবেদন ও বিস্তারিত পড়ুন" : "Read published newspaper coverage"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Stale Warning Notice */}
        {stale && report.status !== "resolved" && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {locale === "bn" ? "তথ্যটি পুরোনো হতে পারে" : "Information may be outdated"}
              </span>
              <span>
                {locale === "bn"
                  ? "গত ২৪ ঘণ্টার মধ্যে কোনো নতুন নিশ্চিতকরণ পাওয়া যায়নি। বর্তমান অবস্থা জানতে সহনাগরিক হিসেবে কনফার্ম বা আপডেট করুন।"
                  : "No confirmation has been received within the last 24 hours. Conditions may have changed."}
              </span>
            </div>
          </div>
        )}

        {/* Timestamps & Community Verification Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">{locale === "bn" ? "রিপোর্টের সময়" : "Reported"}</span>
            <span className="font-bold text-gray-800 block mt-0.5">{createdTime.relative}</span>
            <span className="text-[10px] text-gray-400">{createdTime.absolute}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">{locale === "bn" ? "সর্বশেষ নিশ্চিত" : "Last Confirmed"}</span>
            <span className="font-bold text-gray-800 block mt-0.5">
              {report.lastConfirmedAt ? confirmedTime.relative : locale === "bn" ? "এখনও হয়নি" : "None yet"}
            </span>
            {report.lastConfirmedAt && (
              <span className="text-[10px] text-gray-400">{confirmedTime.absolute}</span>
            )}
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">{locale === "bn" ? "নিশ্চিত করেছেন" : "Confirmations"}</span>
            <span className="font-bold text-emerald-700 text-sm block mt-0.5">
              {locale === "bn" ? toBengaliNumerals(report.confirmCount) : report.confirmCount} {locale === "bn" ? "জন" : "people"}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">{locale === "bn" ? "বিরোধ / আপত্তি" : "Disputes"}</span>
            <span className="font-bold text-amber-700 text-sm block mt-0.5">
              {locale === "bn" ? toBengaliNumerals(report.disputeCount) : report.disputeCount} {locale === "bn" ? "জন" : "people"}
            </span>
          </div>
        </div>

        {/* Location & Map Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wide">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>{locale === "bn" ? "অবস্থান ও মানচিত্র" : "Location Preview"}</span>
          </div>

          {(localized.publicLocationDesc || localized.nearbyLandmark) && (
            <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs space-y-0.5">
              {localized.publicLocationDesc && (
                <div className="font-bold text-gray-900">{localized.publicLocationDesc}</div>
              )}
              {localized.nearbyLandmark && (
                <div className="text-gray-600">
                  {locale === "bn" ? "নিকটবর্তী ল্যান্ডমার্ক: " : "Landmark: "}
                  {localized.nearbyLandmark}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <MapView
              reports={[report]}
              center={[report.latitude, report.longitude]}
              zoom={15}
              height="280px"
              showNeighborhoodJumps={false}
            />
          </div>
        </div>

        {/* Attached Photo */}
        {report.coverPhoto && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide block">
              {locale === "bn" ? "সংযুক্ত ছবি" : "Attached Photo"}
            </span>
            <div className="rounded-2xl overflow-hidden border border-gray-200 max-w-lg">
              <img
                src={report.coverPhoto.publicUrl}
                alt={report.title}
                className="w-full h-auto max-h-80 object-cover"
              />
            </div>
          </div>
        )}

        {/* Primary Community Actions Bar */}
        <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs sm:text-sm text-gray-900 block">
              {locale === "bn" ? "আপনি কি এই এলাকা সম্পর্কে জানেন?" : "Do you have information on this hazard?"}
            </span>
            <span className="text-[11px] text-gray-500">
              {locale === "bn"
                ? "আপনার একটি তথ্য পুরো কমিউনিটির সিদ্ধান্ত গ্রহণে সাহায্য করতে পারে।"
                : "Help fellow commuters make better route decisions."}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "যাচাই / নিশ্চিত করুন" : "Verify / Confirm"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-gray-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "আপডেট যোগ করুন" : "Add Update"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Updates Thread */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
            <span>{locale === "bn" ? "কমিউনিটি আপডেট হিস্ট্রি" : "Community Updates"}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
              {locale === "bn" ? toBengaliNumerals(report.updates?.length || 0) : report.updates?.length || 0}
            </span>
          </h2>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>{locale === "bn" ? "নতুন আপডেট" : "Add Update"}</span>
          </button>
        </div>

        {!report.updates || report.updates.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            {locale === "bn"
              ? "এখনও কোনো কমিউনিটি আপডেট নেই। আপনি প্রথম আপডেট যোগ করতে পারেন।"
              : "No community updates yet. Be the first to share an on-the-ground update."}
          </div>
        ) : (
          <div className="space-y-3">
            {report.updates.map((upd: ReportUpdateItem) => {
              const uTime = formatTimestamp(upd.createdAt, locale);
              return (
                <div
                  key={upd.id}
                  className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/70 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-gray-400 text-[11px]">
                    <span className="font-semibold text-teal-800 uppercase tracking-wider">
                      {upd.updateType === "severity_change"
                        ? locale === "bn" ? "তীব্রতা পরিবর্তন" : "Severity Update"
                        : upd.updateType === "resolution"
                        ? locale === "bn" ? "সমাধান" : "Resolution"
                        : locale === "bn" ? "সাধারণ আপডেট" : "Update"}
                    </span>
                    <span title={uTime.absolute}>{uTime.relative}</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{upd.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <VerifyModal
        reportId={report.id}
        reportTitle={report.title}
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onSuccess={(updated) => {
          setReport({ ...report, ...updated });
        }}
      />

      <UpdateModal
        reportId={report.id}
        reportTitle={report.title}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={(newUpdate) => {
          setReport({
            ...report,
            updates: [newUpdate, ...(report.updates || [])],
          });
        }}
      />

      <AbuseModal
        reportId={report.id}
        isOpen={showAbuseModal}
        onClose={() => setShowAbuseModal(false)}
      />
    </div>
  );
}
