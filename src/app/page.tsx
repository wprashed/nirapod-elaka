"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReportItem, ReportCategory, ReportStatus } from "@/lib/types";
import { CATEGORY_META, toBengaliNumerals } from "@/lib/constants";
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
  Droplets,
  AlertOctagon,
  ShieldCheck,
  PhoneCall,
  Activity,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Flame,
  Zap,
  Building2,
  Navigation,
  Compass,
  FileCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Dynamically import MapView to prevent SSR window issues
const MapView = dynamic(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse">
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const feedTopRef = useRef<HTMLDivElement>(null);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "100"); // Retrieve all items for rich client-side search & pagination

      const res = await fetch(`/api/v1/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    fetchReports();
    // Live polling: refresh hazards every 30 seconds
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports();
  };

  // Live statistical aggregates
  const stats = useMemo(() => {
    const total = reports.length;
    const waterlogged = reports.filter((r) => r.category === "waterlogging").length;
    const roadIssues = reports.filter(
      (r) => r.category === "blocked_road" || r.category === "damaged_road" || r.category === "fallen_tree"
    ).length;
    const verified = reports.filter(
      (r) => r.status === "community_confirmed" || !!r.newsSource
    ).length;

    return { total, waterlogged, roadIssues, verified };
  }, [reports]);

  // Major Dhaka commuter corridors for 1-click filter
  const DHAKA_HOTSPOTS = [
    { labelBn: "মিরপুর (১০ ও কাজীপাড়া)", labelEn: "Mirpur Corridor", query: "মিরপুর" },
    { labelBn: "ধানমন্ডি ২৭", labelEn: "Dhanmondi 27", query: "ধানমন্ডি" },
    { labelBn: "উত্তরা ও দিয়াবাড়ি", labelEn: "Uttara & Diabari", query: "উত্তরা" },
    { labelBn: "গুলশান ২ ও বারিধারা", labelEn: "Gulshan & Baridhara", query: "গুলশান" },
    { labelBn: "বনানী ১১ নম্বর", labelEn: "Banani 11", query: "বনানী" },
    { labelBn: "কুড়িল ও এক্সপ্রেসওয়ে", labelEn: "Kuril & Expressway", query: "কুড়িল" },
    { labelBn: "বসুন্ধরা গেট", labelEn: "Bashundhara Gate", query: "বসুন্ধরা" },
    { labelBn: "মহাখালী আমতলী", labelEn: "Mohakhali Amtoli", query: "মহাখালী" },
    { labelBn: "ফার্মগেট মোড়", labelEn: "Farmgate", query: "ফার্মগেট" },
    { labelBn: "তেজগাঁও সাতরাস্তা", labelEn: "Tejgaon Satrasta", query: "তেজগাঁও" },
    { labelBn: "শাহবাগ ও টিএসসি", labelEn: "Shahbagh & TSC", query: "শাহবাগ" },
    { labelBn: "মতিঝিল শাপলা চত্বর", labelEn: "Motijheel", query: "মতিঝিল" },
    { labelBn: "মালিবাগ ও খিলগাঁও", labelEn: "Malibagh & Khilgaon", query: "মালিবাগ" },
    { labelBn: "সায়েদাবাদ ও যাত্রাবাড়ী", labelEn: "Sayedabad", query: "সায়েদাবাদ" },
    { labelBn: "পুরান ঢাকা ও লালবাগ", labelEn: "Old Dhaka & Lalbagh", query: "পুরান ঢাকা" },
    { labelBn: "গাবতলী বেড়িবাঁধ", labelEn: "Gabtoli", query: "গাবতলী" },
  ];

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reports.slice(start, start + pageSize);
  }, [reports, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (feedTopRef.current) {
      feedTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Hero Civic Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 text-white p-6 sm:p-9 shadow-lg">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 backdrop-blur-sm text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {locale === "bn"
                  ? `ঢাকা লাইভ নাগরিক নেটওয়ার্ক • ${toBengaliNumerals(stats.total)}টি সক্রিয় রিপোর্ট`
                  : `Dhaka Live Civic Network • ${stats.total} Active Hazards`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {locale === "bn"
                ? "সরাসরি নাগরিক ও সংবাদ তথ্যে নিরাপদ রাখুন আপনার যাতায়াত"
                : "Real-Time Civic Hazard & Disruption Alerts for Dhaka"}
            </h1>

            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              {locale === "bn"
                ? "ঢাকার বিভিন্ন সড়কের জলাবদ্ধতা, বড় গর্ত, নর্দমা সংস্কারের উন্মুক্ত খাদ ও তীব্র যানজট এড়িয়ে চলুন। আপনার আশেপাশের সমস্যা সরাসরি রিপোর্ট করুন।"
                : "Crowdsourced and newspaper-verified reports of waterlogging, broken culverts, open trenches, and road disruptions across Dhaka neighborhoods."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/report/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-teal-950 font-bold rounded-2xl shadow-md transition text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-teal-900"
            >
              <PlusCircle className="w-5 h-5 text-teal-950" />
              <span>{t("report.newTitle", "হ্যাজার্ড রিপোর্ট করুন")}</span>
            </Link>

            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-800/80 hover:bg-teal-700/80 text-white font-semibold rounded-2xl border border-teal-600/50 transition text-sm"
            >
              <Compass className="w-4 h-4 text-teal-300" />
              <span>{locale === "bn" ? "নিকটস্থ সমস্যা খুঁজুন" : "Browse Nearby Hazards"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Live Civic Metrics KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory("all");
            setSelectedStatus("active");
            setCurrentPage(1);
          }}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition group focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {locale === "bn" ? "সক্রিয় হ্যাজার্ড" : "Active Hazards"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {locale === "bn" ? toBengaliNumerals(stats.total) : stats.total}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1 flex items-center gap-1">
            <span>{locale === "bn" ? "লাইভ পর্যবেক্ষণ চলছে" : "Live monitored"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory("waterlogging");
            setCurrentPage(1);
          }}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {locale === "bn" ? "জলাবদ্ধ এলাকা" : "Waterlogged Areas"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900">
            {locale === "bn" ? toBengaliNumerals(stats.waterlogged) : stats.waterlogged}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <span>{locale === "bn" ? "বৃষ্টি ও নিষ্কাশন সমস্যা" : "Drainage & rain stalls"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory("blocked_road");
            setCurrentPage(1);
          }}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {locale === "bn" ? "সড়ক বাধা ও ক্ষতি" : "Road Obstructions"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950">
            {locale === "bn" ? toBengaliNumerals(stats.roadIssues) : stats.roadIssues}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1 flex items-center gap-1">
            <span>{locale === "bn" ? "খনন, ধস ও ভাঙা রাস্তা" : "Digging & craters"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {locale === "bn" ? "যাচাইকৃত তথ্য" : "Verified Sources"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">
            {locale === "bn" ? toBengaliNumerals(stats.verified) : stats.verified}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {locale === "bn" ? "সংবাদপত্র ও প্রত্যক্ষদর্শী দ্বারা" : "By newspapers & citizens"}
          </div>
        </div>
      </div>

      {/* ── 3. Quick Hotspot Corridors Strip (16 Popular Dhaka Locations) ── */}
      <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-600" />
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {locale === "bn" ? "ঢাকার গুরুত্বপূর্ণ এলাকা ও করিডোরসমূহ:" : "Key Dhaka Zones & Corridors:"}
            </span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 underline"
            >
              {locale === "bn" ? "ফিল্টার মুছুন (Clear Filter)" : "Clear Filter"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DHAKA_HOTSPOTS.map((hotspot) => {
            const isActive = searchQuery === hotspot.query;
            return (
              <button
                key={hotspot.query}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setSearchQuery("");
                  } else {
                    setSearchQuery(hotspot.query);
                  }
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? "bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 border-gray-200"
                }`}
              >
                <span>📍 {locale === "bn" ? hotspot.labelBn : hotspot.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Search & Interactive Filter Bar ───────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        {/* Screen-reader live region */}
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
                  ? "স্থান বা কীওয়ার্ড খুঁজুন (যেমন: ধানমন্ডি ২৭, মিরপুর ১০, কুড়িল, মতিঝিল, মালিবাগ)..."
                  : "Search location or keyword (e.g. Dhanmondi, Kuril, Motijheel, Mirpur)..."
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

          {/* Location Quick Dropdown Selector */}
          <select
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 text-gray-700 font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value="">{locale === "bn" ? "📍 সকল এলাকা (ঢাকা)" : "📍 All Locations (Dhaka)"}</option>
            {DHAKA_HOTSPOTS.map((h) => (
              <option key={h.query} value={h.query}>
                {locale === "bn" ? h.labelBn : h.labelEn}
              </option>
            ))}
          </select>

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

        {/* Category Filter Chips with Live Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition border ${
              selectedCategory === "all"
                ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
          >
            {locale === "bn" ? "সকল হ্যাজার্ড" : "All Hazards"} ({reports.length})
          </button>
          {REPORT_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
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

      {/* ── 5. Main Map & Reports Feed Layout ─────────────────────────── */}
      <div ref={feedTopRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Section */}
        {(viewMode === "split" || viewMode === "map") && (
          <div className={viewMode === "split" ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="bg-white rounded-3xl border border-gray-200 p-3 shadow-xs">
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
                  <span className="flex items-center gap-1">⚠️ {locale === "bn" ? "ক্ষতিগ্রস্ত রাস্তা" : "Damaged"}</span>
                  <span className="flex items-center gap-1">⚡ {locale === "bn" ? "ইউটিলিটি" : "Utility"}</span>
                  <span className="flex items-center gap-1">🚶 {locale === "bn" ? "পথচারী" : "Pedestrian"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {locale === "bn"
                      ? "কমিউনিটি রিপোর্ট মাঠপর্যায়ে নিশ্চিত করুন"
                      : "Ground confirmations keep reports active"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Feed Section with Pagination */}
        {(viewMode === "split" || viewMode === "list") && (
          <div className={viewMode === "split" ? "lg:col-span-5 space-y-4" : "lg:col-span-12 space-y-4"}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                <span>{locale === "bn" ? "সাম্প্রতিক হ্যাজার্ড রিপোর্ট" : "Recent Hazard Reports"}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                  {reports.length}
                </span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-[11px] py-1 px-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium"
                  title="Items per page"
                >
                  <option value={4}>4 / page</option>
                  <option value={6}>6 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>

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
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-white border border-gray-200 animate-pulse p-4 space-y-3" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-3">
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
              <div className="space-y-3">
                {/* Paginated Report Cards */}
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {paginatedReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>

                {/* ── Enhanced Pagination Bar ──────────────────────────── */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Reports feed pagination"
                    className="bg-white rounded-2xl border border-gray-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="text-gray-500 font-medium">
                      {locale === "bn"
                        ? `পৃষ্ঠা ${toBengaliNumerals(currentPage)} এর ${toBengaliNumerals(totalPages)} (মোট ${toBengaliNumerals(reports.length)}টি)`
                        : `Page ${currentPage} of ${totalPages} (${reports.length} total)`}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* First Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        title={locale === "bn" ? "প্রথম পৃষ্ঠা" : "First page"}
                        aria-label="First page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Previous Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none font-semibold flex items-center gap-1 transition"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>{locale === "bn" ? "পূর্ববর্তী" : "Prev"}</span>
                      </button>

                      {/* Numbered Page Buttons */}
                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                          const isEdge = pg === 1 || pg === totalPages;
                          const isNearCurrent = Math.abs(pg - currentPage) <= 1;

                          if (isEdge || isNearCurrent) {
                            return (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => handlePageChange(pg)}
                                aria-current={currentPage === pg ? "page" : undefined}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                  currentPage === pg
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {locale === "bn" ? toBengaliNumerals(pg) : pg}
                              </button>
                            );
                          }

                          if (pg === currentPage - 2 || pg === currentPage + 2) {
                            return (
                              <span key={pg} className="px-0.5 text-gray-400">
                                …
                              </span>
                            );
                          }

                          return null;
                        })}
                      </div>

                      {/* Next Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none font-semibold flex items-center gap-1 transition"
                        aria-label="Next page"
                      >
                        <span>{locale === "bn" ? "পরবর্তী" : "Next"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Last Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        title={locale === "bn" ? "শেষ পৃষ্ঠা" : "Last page"}
                        aria-label="Last page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Emergency & Public Utility Contacts Strip ─────────────── */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              <span>{locale === "bn" ? "জরুরি জাতীয় ও নাগরিক হেল্পলাইন" : "National Emergency & Civic Helplines"}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {locale === "bn"
                ? "তাত্ক্ষণিক জীবনহানির ঝুঁকি, দুর্ঘটনা বা জরুরি সেবায় সরাসরি সংশ্লিষ্ট বিভাগকে ফোন করুন"
                : "Direct helpline assistance for life-threatening emergencies and municipal services"}
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-rose-50 text-rose-800 rounded-full font-bold border border-rose-200 self-start sm:self-auto">
            ২৪/৭ টোল-ফ্রি সেবা
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <a
            href="tel:999"
            className="p-3.5 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-rose-700">৯৯৯</span>
              <span className="text-xs">🚨</span>
            </div>
            <div className="mt-2 text-xs font-bold text-rose-950">
              {locale === "bn" ? "জাতীয় জরুরি সেবা" : "National Emergency"}
            </div>
            <span className="text-[10px] text-rose-800 mt-0.5 block">পুলিশ • ফায়ার • অ্যাম্বুলেন্স</span>
          </a>

          <a
            href="tel:16162"
            className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-blue-700">১৬১৬২</span>
              <span className="text-xs">💧</span>
            </div>
            <div className="mt-2 text-xs font-bold text-blue-950">
              {locale === "bn" ? "ঢাকা ওয়াসা" : "Dhaka WASA"}
            </div>
            <span className="text-[10px] text-blue-800 mt-0.5 block">পানি নিষ্কাশন ও জলাবদ্ধতা</span>
          </a>

          <a
            href="tel:16575"
            className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-purple-700">১৬৫৭৫</span>
              <span className="text-xs">⚡</span>
            </div>
            <div className="mt-2 text-xs font-bold text-purple-950">
              {locale === "bn" ? "তিতাস গ্যাস" : "Titas Gas Emergency"}
            </div>
            <span className="text-[10px] text-purple-800 mt-0.5 block">গ্যাস লিকেজ ও দুর্ঘটনা</span>
          </a>

          <a
            href="tel:16116"
            className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-amber-800">১৬১১৬</span>
              <span className="text-xs">🔌</span>
            </div>
            <div className="mt-2 text-xs font-bold text-amber-950">
              {locale === "bn" ? "ডিপিডিসি / ডেসকো" : "Power Grid Call Center"}
            </div>
            <span className="text-[10px] text-amber-800 mt-0.5 block">বিদ্যুৎ তার বা ট্রান্সফরমার</span>
          </a>

          <a
            href="tel:109"
            className="p-3.5 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-teal-700">১০৯</span>
              <span className="text-xs">🛡️</span>
            </div>
            <div className="mt-2 text-xs font-bold text-teal-950">
              {locale === "bn" ? "নারী ও শিশু হেল্প" : "Child & Women Safety"}
            </div>
            <span className="text-[10px] text-teal-800 mt-0.5 block">আইনি সহায়তা ও নিরাপত্তা</span>
          </a>

          <a
            href="tel:199"
            className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-2xl flex flex-col justify-between transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-emerald-700">১৯৯</span>
              <span className="text-xs">🚑</span>
            </div>
            <div className="mt-2 text-xs font-bold text-emerald-950">
              {locale === "bn" ? "স্বাস্থ্য বাতায়ন" : "National Health Desk"}
            </div>
            <span className="text-[10px] text-emerald-800 mt-0.5 block">জরুরি চিকিৎসা পরামর্শ</span>
          </a>
        </div>
      </div>

      {/* ── 7. How NirapodElaka Works (3 Steps) ───────────────────────── */}
      <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 rounded-3xl border border-teal-200/80 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider">
            {locale === "bn" ? "কীভাবে কাজ করে" : "How NirapodElaka Works"}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {locale === "bn" ? "৩ ধাপে আপনার এলাকাকে নিরাপদ করুন" : "3 Steps to Protect Your Community"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {locale === "bn"
              ? "সাধারণ নাগরিকদের সমন্বয়ে গড়ে ওঠা ঢাকা শহরের সবচেয়ে দ্রুতগতির হ্যাজার্ড শেয়ারিং নেটওয়ার্ক।"
              : "A crowdsourced platform connecting commuters and residents to share accurate ground reality."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              ১
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {locale === "bn" ? "শনাক্ত ও পিন করুন" : "1. Spot & Pin"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {locale === "bn"
                ? "রাস্তায় জলাবদ্ধতা, বিপজ্জনক ম্যানহোল বা খোঁড়াখুঁড়ি দেখলে মানচিত্রে পিন ফেলে ছবি ও বিবরণ দিন।"
                : "Spot waterlogging, broken culverts, or traffic blocks. Drop an exact pin on the interactive map with description."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              ২
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {locale === "bn" ? "কমিউনিটি যাচাইকরণ" : "2. Community Verify"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {locale === "bn"
                ? "ঘটনাস্থলের অন্যান্য নাগরিকরা 'এখনও বিদ্যমান' বা 'সমাধান হয়েছে' ভোটের মাধ্যমে সত্যতা যাচাই করেন।"
                : "Commuters on the spot confirm or dispute current conditions, ensuring verified, tamper-proof information."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              ৩
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {locale === "bn" ? "অন্যদের নিরাপদ রাখুন" : "3. Protect Neighbors"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {locale === "bn"
                ? "হাজার হাজার যাত্রী বিকল্প রুট ব্যবহার করে ভোগান্তি এড়াতে পারেন এবং নগর কর্তৃপক্ষ সমস্যার দ্রুত খোঁজ পায়।"
                : "Help thousands of daily commuters reroute around gridlocks while building your civic reputation score."}
            </p>
          </div>
        </div>
      </div>

      {/* ── 8. Civic Reputation & Rewards Showcase ────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Award className="w-4 h-4 text-amber-600" />
            <span>{locale === "bn" ? "নাগরিক সম্মাননা ও ব্যাজ" : "Civic Reputation & Badges"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            {locale === "bn"
              ? "সঠিক তথ্য দিন, পয়েন্ট অর্জন করুন এবং শহরের গার্ডিয়ান হন"
              : "Contribute Accurate Ground Truth & Earn Dhaka Guardian Badges"}
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {locale === "bn"
              ? "প্রতিটি যাচাইকৃত হ্যাজার্ড রিপোর্টে ২৫ পয়েন্ট, ছবি যুক্ত করলে ১০ পয়েন্ট এবং মাঠপর্যায়ে কনফার্মেশনে ১০ পয়েন্ট যোগ হয়।"
              : "Earn points for verified reports (+25 pts), photographic evidence (+10 pts), and field confirmations (+10 pts) to rise through civic tiers."}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
              🌱 {locale === "bn" ? "প্রথম সঙ্কেত" : "First Alert"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
              💧 {locale === "bn" ? "জলপ্রহরী" : "Flood Scout"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
              🚧 {locale === "bn" ? "পথের দিশারী" : "Route Guardian"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              🏆 {locale === "bn" ? "ঢাকা হিরো" : "Dhaka Hero"}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/register"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md transition text-xs sm:text-sm text-center"
          >
            {locale === "bn" ? "নাগরিক প্রতিনিধি হিসেবে যোগ দিন" : "Join as Civic Contributor"}
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition text-xs sm:text-sm text-center"
          >
            {locale === "bn" ? "প্ল্যাটফর্ম নীতিমালা" : "Civic Guidelines"}
          </Link>
        </div>
      </div>
    </div>
  );
}
