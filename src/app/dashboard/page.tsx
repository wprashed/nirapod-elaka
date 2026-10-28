"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/types";
import { ReportCard } from "@/components/ReportCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { computeGamification, BADGES } from "@/lib/gamification";
import { toBengaliNumerals } from "@/lib/constants";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle2,
  Shield,
  PlusCircle,
  Sparkles,
  Award,
  Flame,
  Users,
  Compass,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function DashboardPage() {
  const { locale, t } = useI18n();
  const { user } = useAuth();
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

  // Compute gamification metrics
  const gamification = computeGamification({
    points: user?.civicPoints ?? 85,
    reportsCount: user?.reportsSubmitted ?? 2,
    verificationsCount: user?.verificationsCount ?? 6,
    updatesCount: 2,
    categoriesReported: reports.map((r) => r.category),
    streakDays: user?.streakDays ?? 3,
  });

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
              ? `স্বাগতম, ${user?.name || "নাগরিক"}! আপনার নাগরিক সম্মাননা ও কমিউনিটি অবদানসমূহ পর্যবেক্ষণ করুন।`
              : `Welcome, ${user?.name || "Citizen"}! Track your civic reputation and neighborhood impact.`}
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

      {/* Gamification Level & Reputation Hero Banner */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
              {gamification.currentTier.badgeIcon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  Level {gamification.currentTier.level}
                </span>
                <span className="text-xs text-teal-300 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {locale === "bn"
                      ? `${toBengaliNumerals(gamification.streakDays)} দিনের স্ট্রিক`
                      : `${gamification.streakDays}-Day Active Streak`}
                  </span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {locale === "bn" ? gamification.currentTier.titleBn : gamification.currentTier.titleEn}
              </h2>
              <p className="text-xs text-teal-200/80">
                {locale === "bn"
                  ? "আপনার সক্রিয় সতর্কবার্তায় ঢাকা শহর আরও নিরাপদ হয়ে উঠছে।"
                  : "Your on-the-ground alerts are actively protecting everyday commuters."}
              </p>
            </div>
          </div>

          {/* Points & Progress Box */}
          <div className="w-full md:w-72 bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{locale === "bn" ? "নাগরিক স্কোর" : "Civic Score"}</span>
              </span>
              <span className="text-lg font-black text-amber-300">
                {locale === "bn" ? toBengaliNumerals(gamification.civicPoints) : gamification.civicPoints} pts
              </span>
            </div>

            {gamification.nextTier ? (
              <div className="space-y-1">
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-300 to-amber-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${gamification.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-teal-200/80">
                  <span>
                    {locale === "bn"
                      ? `পরবর্তী: ${gamification.nextTier.titleBn}`
                      : `Next: ${gamification.nextTier.titleEn}`}
                  </span>
                  <span>
                    {locale === "bn"
                      ? `আর ${toBengaliNumerals(gamification.pointsToNextTier)} পয়েন্ট বাকি`
                      : `${gamification.pointsToNextTier} pts left`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-amber-300 font-semibold">
                🏆 {locale === "bn" ? "সর্বোচ্চ স্তর অর্জিত!" : "Maximum Tier Reached!"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact & Activity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">
            {locale === "bn" ? "সহায়তাপ্রাপ্ত যাত্রী" : "Commuters Helped"}
          </span>
          <span className="text-2xl font-black text-teal-700 block">
            ~{locale === "bn" ? toBengaliNumerals(gamification.estimatedCommutersHelped) : gamification.estimatedCommutersHelped}
          </span>
          <span className="text-[11px] text-gray-400">রুট ঝুঁকি এড়াতে সাহায্য</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">
            {locale === "bn" ? "জমা দেওয়া রিপোর্ট" : "Reports Submitted"}
          </span>
          <span className="text-2xl font-black text-gray-900 block">
            {locale === "bn" ? toBengaliNumerals(gamification.reportsSubmitted) : gamification.reportsSubmitted}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            {confirmedReports.length} {locale === "bn" ? "টি কমিউনিটি নিশ্চিত" : "confirmed"}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">
            {locale === "bn" ? "যাচাইকরণ ভোট" : "Confirmations"}
          </span>
          <span className="text-2xl font-black text-blue-600 block">
            {locale === "bn" ? toBengaliNumerals(gamification.verificationsCount) : gamification.verificationsCount}
          </span>
          <span className="text-[11px] text-gray-400">তথ্য নির্ভুল রাখতে অবদান</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">
            {locale === "bn" ? "অর্জিত ব্যাজ" : "Badges Earned"}
          </span>
          <span className="text-2xl font-black text-amber-600 block">
            {locale === "bn" ? toBengaliNumerals(gamification.earnedBadges.length) : gamification.earnedBadges.length} / {BADGES.length}
          </span>
          <span className="text-[11px] text-gray-400">নাগরিক সম্মাননা</span>
        </div>
      </div>

      {/* Badges & Achievements Showcase */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>{locale === "bn" ? "নাগরিক সম্মাননা ও ব্যাজসমূহ" : "Civic Badges & Achievements"}</span>
            </h2>
            <p className="text-xs text-gray-500">
              {locale === "bn"
                ? "সত্য ও দায়িত্বশীল তথ্য দিয়ে নাগরিকদের পথ চলায় সহায়তা করে ব্যাজ অর্জন করুন।"
                : "Earn achievements by reporting, confirming, and updating local hazard conditions."}
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
            {gamification.earnedBadges.length} {locale === "bn" ? "টি আনলকড" : "Unlocked"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Earned Badges */}
          {gamification.earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="p-3.5 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 rounded-2xl border border-emerald-200 flex items-start gap-3 shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                {badge.icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-900 text-xs">
                    {locale === "bn" ? badge.titleBn : badge.titleEn}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">
                    ✓
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  {locale === "bn" ? badge.descriptionBn : badge.descriptionEn}
                </p>
              </div>
            </div>
          ))}

          {/* Locked Badges */}
          {gamification.lockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200 flex items-start gap-3 opacity-60"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center text-lg shrink-0 grayscale">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-gray-600 text-xs block">
                  {locale === "bn" ? badge.titleBn : badge.titleEn}
                </span>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {locale === "bn" ? badge.descriptionBn : badge.descriptionEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gamification Point Rules Guide */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-teal-700" />
          <span>{locale === "bn" ? "নাগরিক পয়েন্ট অর্জনের নিয়মাবলী" : "How to Earn Civic Points"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-teal-200/80 space-y-1">
            <span className="font-bold text-gray-900 block">+২৫ পয়েন্ট</span>
            <p className="text-gray-600 text-[11px]">নতুন হ্যাজার্ড বা বিঘ্ন রিপোর্ট সাবমিট করলে</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-teal-200/80 space-y-1">
            <span className="font-bold text-gray-900 block">+১০ পয়েন্ট বোনাস</span>
            <p className="text-gray-600 text-[11px]">রিপোর্টের সাথে ঘটনাস্থলের বাস্তব ছবি যোগ করলে</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-teal-200/80 space-y-1">
            <span className="font-bold text-gray-900 block">+১০ পয়েন্ট</span>
            <p className="text-gray-600 text-[11px]">সহনাগরিকের সক্রিয় হ্যাজার্ড সরেজমিনে কনফার্ম করলে</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-teal-200/80 space-y-1">
            <span className="font-bold text-gray-900 block">+১৫ পয়েন্ট</span>
            <p className="text-gray-600 text-[11px]">পরিস্থিতির উন্নতি বা পরিবর্তনের তাজা আপডেট দিলে</p>
          </div>
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
