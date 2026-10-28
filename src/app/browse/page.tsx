"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ReportItem, ReportCategory, ReportStatus } from "@/lib/types";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/validation";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { ReportCard } from "@/components/ReportCard";
import { useI18n } from "@/lib/i18n";
import { Search, ListFilter, ArrowUpDown, PlusCircle, RefreshCw, AlertCircle } from "lucide-react";

export default function BrowsePage() {
  const { locale, t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [sort, setSort] = useState<"newest" | "nearest" | "recently_confirmed" | "unresolved">("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (status !== "all") params.append("status", status);
      if (search.trim()) params.append("search", search.trim());
      params.append("sort", sort);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/v1/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Browse fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search (Item 21)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchReports();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchReports();
  }, [category, status, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t("browse.title", "সব হ্যাজার্ড রিপোর্ট ব্রাউজ করুন")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {locale === "bn"
              ? "ঢাকার সমস্ত পাড়া-মহল্লার রিপোর্ট খুঁজুন, ফিল্টার করুন এবং তাজা আপডেট পর্যবেক্ষণ করুন।"
              : "Search, filter, and monitor community hazard reports across Dhaka neighborhoods."}
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

      {/* Filter & Controls Panel */}
      <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Screen reader announcement (Audit Item 29) */}
        <div aria-live="polite" className="sr-only">
          {loading
            ? (locale === "bn" ? "রিপোর্ট অনুসন্ধান করা হচ্ছে..." : "Searching reports...")
            : (locale === "bn"
                ? `${reports.length} টি রিপোর্ট পাওয়া গেছে`
                : `${reports.length} hazards found`)}
        </div>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === "bn"
                ? "স্থান বা কীওয়ার্ড খুঁজুন (যেমন: মিরপুর, ধানমন্ডি, মালিবাগ, গাছ, জলাবদ্ধতা)..."
                : "Search by place or hazard (e.g. Mirpur, Dhanmondi, Tree, Flooding)..."
            }
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
          >
            {locale === "bn" ? "খুঁজুন" : "Search"}
          </button>
        </form>

        {/* Dropdown Filters & Sorters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Category */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">
              {locale === "bn" ? "ক্যাটাগরি ফিল্টার" : "Category"}
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setPage(1);
              }}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{locale === "bn" ? "সব ক্যাটাগরি" : "All Categories"}</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].icon} {locale === "bn" ? CATEGORY_META[c].labelBn : CATEGORY_META[c].labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">
              {locale === "bn" ? "অবস্থা ফিল্টার" : "Status"}
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{locale === "bn" ? "সব অবস্থা" : "All Statuses"}</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {locale === "bn" ? STATUS_META[s].labelBn : STATUS_META[s].labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-gray-500 font-medium mb-1">
              {locale === "bn" ? "সাজানোর ক্রম" : "Sort By"}
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as any);
                setPage(1);
              }}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="newest">{locale === "bn" ? "সর্বশেষ রিপোর্ট (Newest)" : "Most Recent"}</option>
              <option value="recently_confirmed">{locale === "bn" ? "সম্প্রতি নিশ্চিতকৃত (Fresh)" : "Recently Confirmed"}</option>
              <option value="unresolved">{locale === "bn" ? "অসমাধানকৃত সমস্যা (Unresolved)" : "Unresolved"}</option>
              <option value="nearest">{locale === "bn" ? "নিকটতম (Nearest)" : "Nearest"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            {locale === "bn"
              ? `মোট পাওয়া গেছে: ${total} টি রিপোর্ট`
              : `Showing ${reports.length} of ${total} reports`}
          </span>
          <button
            type="button"
            onClick={fetchReports}
            className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{locale === "bn" ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-gray-200 animate-pulse p-4" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">
              {t("browse.noResults", "কোনো রিপোর্ট পাওয়া যায়নি")}
            </h3>
            <p className="text-xs text-gray-500">
              {locale === "bn"
                ? "অনুগ্রহ করে আপনার ফিল্টার বা অনুসন্ধান শব্দ পরিবর্তন করে চেষ্টা করুন।"
                : "Try clearing filters or adjusting your search keywords."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>

            {/* Item 20: Pagination Controls */}
            {total > 20 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 text-xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  ← {locale === "bn" ? "পূর্ববর্তী" : "Previous"}
                </button>

                <span className="font-bold text-gray-600">
                  {locale === "bn"
                    ? `পৃষ্ঠা ${page} / ${Math.ceil(total / 20)}`
                    : `Page ${page} of ${Math.ceil(total / 20)}`}
                </span>

                <button
                  type="button"
                  disabled={page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  {locale === "bn" ? "পরবর্তী" : "Next"} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
