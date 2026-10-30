"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReportItem, ReportCategory, ReportStatus } from "@/lib/types";
import { CATEGORY_META } from "@/lib/constants";
import { REPORT_CATEGORIES } from "@/lib/validation";
import { ReportCard } from "@/components/ReportCard";
import { useI18n } from "@/lib/i18n";
import {
  MapPin,
  List,
  Map as MapIcon,
  Search,
  Filter,
  PlusCircle,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";

// Dynamically import MapView to prevent SSR window issues
const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse">
        <span>মানচিত্র লোড হচ্ছে... / Loading interactive map...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  const { locale, t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"split" | "map" | "list">("split");
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "active" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/v1/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReports();
    // Live polling: refresh hazards every 30 seconds
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Civic Transparency Notice */}
      <div className="bg-gradient-to-r from-teal-50 via-teal-100/40 to-blue-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[11px] font-bold uppercase tracking-wider">
              {locale === "bn" ? "নাগরিক তথ্য" : "Civic Platform"}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {locale === "bn" ? "ঢাকা লাইভ নাগরিক নেটওয়ার্ক" : "Dhaka Live Civic Network"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t("home.title", "আপনার এলাকায় কী হচ্ছে?")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
            {locale === "bn"
              ? "ঢাকার বিভিন্ন এলাকার জলাবদ্ধতা, রাস্তা অবরুদ্ধতা, ট্রাফিক বিঘ্ন ও গণপরিসর ঝুঁকি সম্পর্কে তথ্য জানুন এবং অন্যদের সতর্ক করুন।"
              : "Discover, report, and verify neighborhood disruptions, flooding, and hazards across Dhaka."}
          </p>
        </div>

        <Link
          href="/report/new"
          className="shrink-0 flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-md transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t("report.newTitle", "হ্যাজার্ড রিপোর্ট করুন")}</span>
        </Link>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        {/* Screen-reader live region (Audit Item 29) */}
        <div aria-live="polite" className="sr-only">
          {loading
            ? (locale === "bn" ? "হ্যাজার্ড তথ্য লোড হচ্ছে..." : "Loading hazards...")
            : (locale === "bn"
                ? `${reports.length} টি হ্যাজার্ড মানচিত্রে ও তালিকায় প্রদর্শিত হচ্ছে`
                : `${reports.length} hazards currently displayed on map and list`)}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "bn"
                  ? "স্থান বা কীওয়ার্ড খুঁজুন (যেমন: ধানমন্ডি ২৭, মিরপুর ১০, মালিবাগ)..."
                  : "Search location or keyword (e.g. Dhanmondi, Kazipara, Malibagh)..."
              }
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
            >
              {locale === "bn" ? "খুঁজুন" : "Search"}
            </button>
          </form>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-end sm:self-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === "split"
                  ? "bg-white text-teal-700 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="hidden sm:inline">{locale === "bn" ? "উভয়ই" : "Split"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === "map"
                  ? "bg-white text-teal-700 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "মানচিত্র" : "Map"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === "list"
                  ? "bg-white text-teal-700 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "তালিকা" : "List"}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition border ${
              selectedCategory === "all"
                ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
          >
            {locale === "bn" ? "সকল হ্যাজার্ড" : "All Hazards"}
          </button>
          {REPORT_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{locale === "bn" ? meta.labelBn : meta.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Section */}
        {(viewMode === "split" || viewMode === "map") && (
          <div className={viewMode === "split" ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs">
              <MapView
                reports={reports}
                selectedReportId={selectedReport?.id}
                onSelectReport={(rep) => setSelectedReport(rep)}
                height={viewMode === "map" ? "650px" : "550px"}
              />

              {/* Map Legend */}
              <div className="mt-3 pt-3 border-t border-gray-100 px-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">
                    {locale === "bn" ? "সংকেত নির্দেশিকা:" : "Legend:"}
                  </span>
                  <span className="flex items-center gap-1">💧 {locale === "bn" ? "জলাবদ্ধতা" : "Flooding"}</span>
                  <span className="flex items-center gap-1">🚧 {locale === "bn" ? "অবরোধ" : "Blocked"}</span>
                  <span className="flex items-center gap-1">🌳 {locale === "bn" ? "গাছ" : "Tree"}</span>
                  <span className="flex items-center gap-1">🚗 {locale === "bn" ? "যানজট" : "Traffic"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {locale === "bn"
                      ? "কমিউনিটি রিপোর্ট যাচাইবিহীন হতে পারে।"
                      : "Reports are community submitted and may be unverified."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Feed Section */}
        {(viewMode === "split" || viewMode === "list") && (
          <div className={viewMode === "split" ? "lg:col-span-5 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                <span>{locale === "bn" ? "সাম্প্রতিক হ্যাজার্ড রিপোর্ট" : "Recent Hazard Reports"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                  {reports.length}
                </span>
              </h2>

              <button
                type="button"
                onClick={fetchReports}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 p-1 rounded-md"
                aria-label="Refresh reports list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{locale === "bn" ? "রিফ্রেশ" : "Refresh"}</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-white border border-gray-200 animate-pulse p-4 space-y-3" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t("home.noReports", "এই ফিল্টারে কোনো রিপোর্ট নেই")}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {t("home.noReportsHint", "আপনার আশেপাশের কোনো সমস্যা থাকলে সবার প্রথমে রিপোর্ট করুন।")}
                </p>
                <Link
                  href="/report/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t("report.newTitle", "হ্যাজার্ড রিপোর্ট")}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
