"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/types";
import { ReportCard } from "@/components/ReportCard";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle2,
  Shield,
  PlusCircle,
  Bell,
  Settings,
} from "lucide-react";

export default function DashboardPage() {
  const { locale, t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/reports?limit=10")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingReports = reports.filter((r) => r.status === "submitted" || r.status === "under_review");
  const confirmedReports = reports.filter((r) => r.status === "community_confirmed");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t("dashboard.title", "আমার ড্যাশবোর্ড")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {locale === "bn"
              ? "আপনার জমা দেওয়া রিপোর্ট, যাচাইকরণ অবদান এবং নোটিশ পর্যবেক্ষণ করুন।"
              : "Review your submitted reports, verification contributions, and moderation notices."}
          </p>
        </div>

        <Link
          href="/report/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{locale === "bn" ? "নতুন রিপোর্ট করুন" : "Report a Hazard"}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-400 block">
            {locale === "bn" ? "জমা দেওয়া রিপোর্ট" : "Reports Submitted"}
          </span>
          <span className="text-2xl font-black text-gray-900 block">{reports.length}</span>
          <span className="text-[11px] text-teal-700 font-medium">কমিউনিটি সহায়ক</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-400 block">
            {locale === "bn" ? "পর্যালোচনাধীন" : "Awaiting Review"}
          </span>
          <span className="text-2xl font-black text-blue-600 block">{pendingReports.length}</span>
          <span className="text-[11px] text-gray-500">মডারেশন যাচাই হচ্ছে</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-400 block">
            {locale === "bn" ? "কমিউনিটি নিশ্চিত" : "Confirmed by Others"}
          </span>
          <span className="text-2xl font-black text-emerald-600 block">{confirmedReports.length}</span>
          <span className="text-[11px] text-gray-500">অন্যরা সমর্থন করেছেন</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-400 block">
            {locale === "bn" ? "নোটিশ" : "Notices"}
          </span>
          <span className="text-2xl font-black text-gray-900 block">১</span>
          <span className="text-[11px] text-gray-500">সিস্টেম বার্তা</span>
        </div>
      </div>

      {/* Notice Card */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-3xl text-xs text-teal-950 flex items-start gap-3 shadow-xs">
        <Shield className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            {locale === "bn"
              ? "দায়িত্বশীল নাগরিক নীতি (No Public Leaderboard)"
              : "Responsible Civic Policy (No Gamification or Leaderboards)"}
          </span>
          <p className="text-teal-900 leading-relaxed">
            {locale === "bn"
              ? "নিরাপদ এলাকা ভুয়া বা অতিরঞ্জিত তথ্য নিরুৎসাহিত করতে কোনো পাবলিক লিডারবোর্ড বা গেমিফিকেশন সমর্থন করে না। আমাদের একমাত্র লক্ষ্য নাগরিকদের সঠিক ও নির্ভরযোগ্য তথ্য প্রদান।"
              : "NirapodElaka intentionally does not include public leaderboards or competitive gamification to discourage false or excessive reporting. Reliable public safety information is our sole priority."}
          </p>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="space-y-4">
        <h2 className="font-bold text-gray-900 text-base sm:text-lg">
          {locale === "bn" ? "আপনার সাম্প্রতিক কন্ট্রিবিউশন" : "Your Recent Contributions"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-gray-200 animate-pulse p-4" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.slice(0, 4).map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
