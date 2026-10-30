"use client";

import React from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { StatusBadge } from "./StatusBadge";
import { formatTimestamp, isStale, toBengaliNumerals } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { MapPin, Clock, ThumbsUp, AlertTriangle, ArrowRight, Camera, CheckCircle2, Newspaper, ExternalLink } from "lucide-react";

interface ReportCardProps {
  report: ReportItem;
  className?: string;
}

export function ReportCard({ report, className = "" }: ReportCardProps) {
  const { locale, t } = useI18n();
  const timeInfo = formatTimestamp(report.createdAt, locale);
  const stale = isStale(
    report.lastConfirmedAt ? new Date(report.lastConfirmedAt) : null,
    report.createdAt
  );

  return (
    <article
      className={`bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between relative ${
        stale ? "border-amber-200 bg-amber-50/20" : ""
      } ${className}`}
    >
      <div>
        {/* Top meta row: Category + Status + News Source */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.status} />
          </div>
          {report.newsSource && (
            <a
              href={report.newsSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
              title={locale === "bn" ? `সংবাদ সূত্র: ${report.newsSource.name}` : `News source: ${report.newsSource.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Newspaper className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{report.newsSource.name}</span>
              <ExternalLink className="w-2.5 h-2.5 text-blue-500 shrink-0" />
            </a>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2 leading-snug">
          <Link
            href={`/report/${report.id}`}
            className="hover:text-teal-700 transition focus:outline-none focus:underline"
          >
            {report.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
          {report.description}
        </p>

        {/* Location & Landmark */}
        {(report.publicLocationDesc || report.nearbyLandmark) && (
          <div className="flex items-start gap-1.5 text-xs text-gray-700 mb-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              {report.publicLocationDesc && (
                <span className="font-medium text-gray-900 block">{report.publicLocationDesc}</span>
              )}
              {report.nearbyLandmark && (
                <span className="text-gray-500 text-[11px] block">
                  {locale === "bn" ? "ল্যান্ডমার্ক: " : "Landmark: "}
                  {report.nearbyLandmark}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        {/* Stale Warning Banner */}
        {stale && report.status !== "resolved" && report.status !== "archived" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1.5 rounded-lg mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{locale === "bn" ? "তথ্য পুরোনো হতে পারে (২৪ ঘণ্টার মধ্যে কোনো নিশ্চিতকরণ নেই)" : "May be outdated (no confirmation in >24h)"}</span>
          </div>
        )}

        {/* Footer info: Timestamps & community confirmation counts */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title={timeInfo.absolute}>
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{timeInfo.relative}</span>
            </span>

            <span className="flex items-center gap-1 text-emerald-700 font-medium" title="Confirmations">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? toBengaliNumerals(report.confirmCount) : report.confirmCount}</span>
            </span>

            {report.coverPhoto && (
              <span className="flex items-center gap-1 text-teal-700" title="Photo attached">
                <Camera className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <Link
            href={`/report/${report.id}`}
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-xs group"
          >
            <span>{locale === "bn" ? "বিস্তারিত" : "Details"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
