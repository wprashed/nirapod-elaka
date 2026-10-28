"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ReportItem, ModerationLogItem, AbuseReportItem, ReportStatus } from "@/lib/types";
import { CATEGORY_META, STATUS_META, formatTimestamp } from "@/lib/constants";
import { CategoryBadge } from "@/components/CategoryBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Archive,
  CheckCheck,
  AlertTriangle,
  History,
  Flag,
  Filter,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react";

export default function ModerationPage() {
  const { locale, t } = useI18n();
  const [queue, setQueue] = useState<ReportItem[]>([]);
  const [logs, setLogs] = useState<ModerationLogItem[]>([]);
  const [abuseReports, setAbuseReports] = useState<AbuseReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "abuse" | "logs">("queue");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Multi-select for bulk actions (Item 23)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQueue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQueue.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: "approve" | "resolve" | "archive") => {
    if (selectedIds.length === 0) return;
    const confirmPrompt = window.confirm(
      `Execute bulk '${action}' on ${selectedIds.length} selected reports?`
    );
    if (!confirmPrompt) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch("/api/v1/moderation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reportId: id,
              action,
              reason: `Bulk moderation action: ${action} applied by civic officer`,
              moderatorId: "mod-civic-officer",
            }),
          })
        )
      );
      setSelectedIds([]);
      fetchModerationData();
    } catch {
      alert("Some bulk actions failed to execute.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Item 24: Action abuse reports
  const handleActionAbuse = async (abuseId: string, reviewStatus: string, action?: string) => {
    try {
      const res = await fetch(`/api/v1/abuse/${abuseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus, action, notes: "Reviewed by moderator" }),
      });
      if (res.ok) {
        fetchModerationData();
      }
    } catch {
      alert("Failed to update abuse report status");
    }
  };

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "resolve" | "archive" | "change_status">("approve");
  const [targetStatus, setTargetStatus] = useState<ReportStatus>("community_confirmed");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchModerationData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/moderation");
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
        setLogs(data.logs || []);
        setAbuseReports(data.abuseReports || []);
      }
    } catch (err) {
      console.error("Moderation fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  const handleOpenAction = (
    report: ReportItem,
    action: "approve" | "reject" | "resolve" | "archive" | "change_status",
    suggestedStatus?: ReportStatus
  ) => {
    setSelectedReport(report);
    setActionType(action);
    if (suggestedStatus) setTargetStatus(suggestedStatus);
    setReason("");
    setActionError(null);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !reason.trim() || reason.trim().length < 3) {
      setActionError(locale === "bn" ? "ন্যূনতম ৩ অক্ষরের মডারেশন কারণ আবশ্যক।" : "A reason (min 3 chars) is mandatory for the audit log.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/v1/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action: actionType,
          status: actionType === "change_status" ? targetStatus : undefined,
          reason: reason.trim(),
          moderatorId: "mod-civic-officer",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Moderation action failed");
      }

      setSelectedReport(null);
      fetchModerationData();
    } catch (err: any) {
      setActionError(err.message || "Failed to execute action");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueue = queue.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-400/30">
              {locale === "bn" ? "অ্যাডমিন ও মডারেশন" : "Civic Moderation Desk"}
            </span>
            <span className="text-xs text-teal-200/80">
              {locale === "bn" ? "দায়িত্বশীল পর্যবেক্ষণ প্যানেল" : "Responsible Verification"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {t("moderation.title", "মডারেশন ও রিভিউ ড্যাশবোর্ড")}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/70 max-w-2xl">
            {locale === "bn"
              ? "ভুয়া তথ্য, স্প্যাম এবং ব্যক্তিগত আক্রমণ প্রতিহত করে নাগরিকদের জন্য নির্ভরযোগ্য তথ্যের নিশ্চয়তা দিন।"
              : "Review community reports, handle disputes, and maintain transparency across neighborhood data."}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchModerationData}
          className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition border border-white/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{locale === "bn" ? "রিফ্রেশ করুন" : "Refresh Desk"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "queue"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>{locale === "bn" ? "রিভিউ সারি (Queue)" : "Review Queue"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">
            {queue.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("abuse")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "abuse"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{locale === "bn" ? "অভিযোগ রিপোর্ট (Abuse)" : "Abuse Reports"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">
            {abuseReports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "logs"
              ? "bg-gray-800 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{locale === "bn" ? "অডিট লগ (Audit Log)" : "Audit Trail"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">
            {logs.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Status filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="font-bold text-gray-500 mr-1">{locale === "bn" ? "ফিল্টার:" : "Filter:"}</span>
            {["all", "submitted", "under_review", "community_confirmed", "disputed", "resolved"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition border ${
                  statusFilter === s
                    ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                }`}
              >
                {s === "all" ? (locale === "bn" ? "সব রিপোর্ট" : "All") : STATUS_META[s as ReportStatus]?.labelBn || s}
              </button>
            ))}
          </div>

          {/* Item 23: Bulk Action Toolbar */}
          {filteredQueue.length > 0 && (
            <div className="bg-white p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredQueue.length && filteredQueue.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-gray-700">
                  {selectedIds.length} of {filteredQueue.length} selected
                </span>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction("approve")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                  >
                    Bulk Approve ({selectedIds.length})
                  </button>
                  <button
                    type="button"
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction("resolve")}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                  >
                    Bulk Resolve ({selectedIds.length})
                  </button>
                  <button
                    type="button"
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction("archive")}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                  >
                    Bulk Archive ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table / List */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                {locale === "bn" ? "এই ক্যাটাগরিতে কোনো রিপোর্ট পেন্ডিং নেই।" : "No reports pending in this queue."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredQueue.map((rep) => {
                  const tTime = formatTimestamp(rep.createdAt);
                  const isChecked = selectedIds.includes(rep.id);

                  return (
                    <div key={rep.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(rep.id)}
                          className="mt-1 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CategoryBadge category={rep.category} />
                            <StatusBadge status={rep.status} />
                            <span className="text-[11px] text-gray-400 font-mono">ID: {rep.id}</span>
                            <span className="text-[11px] text-gray-500">· {tTime.relative}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {rep.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">{rep.description}</p>
                          {rep.publicLocationDesc && (
                            <div className="text-[11px] text-gray-500">
                              📍 {rep.publicLocationDesc}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                            <span className="text-emerald-700 font-medium">✓ {rep.confirmCount} confirms</span>
                            <span className="text-amber-700 font-medium">⚠️ {rep.disputeCount} disputes</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <Link
                          href={`/report/${rep.id}`}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{locale === "bn" ? "দেখুন" : "Inspect"}</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenAction(rep, "approve", "community_confirmed")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200"
                        >
                          {locale === "bn" ? "অনুমোদন" : "Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAction(rep, "resolve", "resolved")}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200"
                        >
                          {locale === "bn" ? "সমাধান চিহ্নিত" : "Resolve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAction(rep, "reject", "disputed")}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200"
                        >
                          {locale === "bn" ? "বিতর্কিত" : "Dispute"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAction(rep, "archive", "archived")}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                        >
                          {locale === "bn" ? "আর্কাইভ" : "Archive"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Abuse Reports */}
      {activeTab === "abuse" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-gray-900 text-base">
            {locale === "bn" ? "নাগরিক অভিযোগ ও ফ্ল্যাগ করা কন্টেন্ট" : "Community Abuse Reports"}
          </h2>
          {abuseReports.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              {locale === "bn" ? "কোনো অভিযোগ পেন্ডিং নেই।" : "No pending abuse reports."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {abuseReports.map((a) => (
                <div key={a.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-rose-700 block mb-0.5">Reason: {a.reason}</span>
                    {a.details && <p className="text-gray-600 mb-1">{a.details}</p>}
                    <span className="text-[11px] text-gray-400">Target Report: {a.targetReportId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      a.reviewStatus === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : a.reviewStatus === "actioned"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {a.reviewStatus}
                    </span>

                    {/* Item 24: Direct interactive actions */}
                    {a.reviewStatus === "pending" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleActionAbuse(a.id, "dismissed")}
                          className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionAbuse(a.id, "actioned", "archive_target")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold"
                        >
                          Takedown Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-gray-900 text-base">
            {locale === "bn" ? "মডারেশন অডিট লগ (অপরিবর্তনযোগ্য রেকর্ড)" : "Moderation Audit History"}
          </h2>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              {locale === "bn" ? "কোনো লগ এন্ট্রি নেই।" : "No log entries recorded."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const lTime = formatTimestamp(log.createdAt);
                return (
                  <div key={log.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 uppercase tracking-wide">
                        Action: {log.action}
                      </span>
                      <span className="text-[11px] text-gray-400" title={lTime.absolute}>
                        {lTime.relative}
                      </span>
                    </div>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-500">Reason: </span>
                      {log.reason}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>Moderator: {log.moderatorId}</span>
                      {log.reportId && <span>Report: {log.reportId}</span>}
                      {log.previousStatus && log.newStatus && (
                        <span>Status: {log.previousStatus} → {log.newStatus}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Dialog Modal with Mandatory Reason */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-black text-lg text-gray-900">
              {locale === "bn" ? "মডারেশন নিশ্চিতকরণ" : "Confirm Moderation Action"}
            </h3>

            <div className="p-3 bg-gray-50 rounded-2xl border text-xs space-y-1">
              <div className="font-bold text-gray-900">{selectedReport.title}</div>
              <div className="text-gray-500">Action: <span className="font-bold text-teal-800 uppercase">{actionType}</span></div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  {locale === "bn" ? "অ্যাকশনের কারণ (অডিট লগের জন্য বাধ্যতামূলক) *" : "Reason for Action (Mandatory for Audit Log) *"}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    locale === "bn"
                      ? "যেমন: একাধিক স্থানীয় প্রত্যক্ষদর্শীর কনফার্মেশন ও ছবি দ্বারা সত্যতা নিশ্চিত..."
                      : "e.g. Corroborated by ground photos and multiple commuter confirmations..."
                  }
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  {locale === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? (locale === "bn" ? "প্রক্রিয়াকরণ..." : "Saving...") : (locale === "bn" ? "অ্যাকশন সম্পন্ন করুন" : "Confirm Action")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
