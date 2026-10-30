"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatTimestamp } from "@/lib/constants";
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  UserX,
  FileText,
  Activity,
  History,
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ArrowRight,
  LogOut,
  UserCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { locale, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "governance" | "audit" | "config">("users");

  // Audit log filtering state (Audit Item 26)
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // User management action modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"role" | "status">("role");
  const [targetRole, setTargetRole] = useState<"user" | "moderator" | "admin">("moderator");
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended">("suspended");
  const [reason, setReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch(`/api/v1/admin/users?search=${encodeURIComponent(searchUser)}`),
        fetch("/api/v1/admin/logs"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminData();
    }
  }, [user, searchUser]);

  // Access Control Guard
  if (authLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500 font-medium">
          {locale === "bn" ? "যাচাই হচ্ছে..." : "Verifying administrator credentials..."}
        </p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">
          {locale === "bn" ? "অ্যাডমিন অনুমতি প্রয়োজন" : "Admin Authorization Required"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {locale === "bn"
            ? "এই পেজটি শুধুমাত্র নিরাপদ এলাকার অনুমোদিত সিস্টেম অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত।"
            : "This administrative desk is restricted to authorized NirapodElaka administrators."}
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/auth/login"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
          >
            {locale === "bn" ? "অ্যাডমিন অ্যাকাউন্টে সাইন ইন করুন" : "Sign In as Admin"}
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition"
          >
            {locale === "bn" ? "হোমে ফিরে যান" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  const handleExecuteUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !reason.trim() || reason.trim().length < 3) {
      setActionError(locale === "bn" ? "ন্যূনতম ৩ অক্ষরের প্রশাসনিক কারণ আবশ্যক।" : "A reason (min 3 chars) is mandatory for the audit log.");
      return;
    }

    setActionSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: actionType === "role" ? "change_role" : "change_status",
          role: actionType === "role" ? targetRole : undefined,
          status: actionType === "status" ? targetStatus : undefined,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute administrative update");
      }

      setSelectedUser(null);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message || "Failed to execute action.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-teal-800/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider border border-teal-400/30">
              👑 Root Civic Administration
            </span>
            <span className="text-xs text-teal-200/80">
              Logged in as: <strong className="text-white">{user.name}</strong> ({user.email})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {locale === "bn" ? "সিস্টেম অ্যাডমিনিস্ট্রেশন ও গভর্ন্যান্স" : "Civic Platform Administration Desk"}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/70 max-w-2xl leading-relaxed">
            {locale === "bn"
              ? "ব্যবহারকারী ব্যবস্থাপনা, রোল অ্যাসাইনমেন্ট, কমিউনিটি সুরক্ষা ও অপরিবর্তনযোগ্য অডিট পর্যবেক্ষণ।"
              : "User role elevation, account suspension, abuse mitigation, and tamper-proof security auditing."}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          className="shrink-0 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition border border-white/20 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{locale === "bn" ? "তথ্য রিফ্রেশ করুন" : "Refresh Metrics"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-gray-500 block">Total Citizens</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 block">{stats.users.total}</span>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="text-emerald-700 font-bold">{stats.users.active} active</span>
              {stats.users.suspended > 0 && (
                <span className="text-rose-700 font-bold">{stats.users.suspended} suspended</span>
              )}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-gray-500 block">Moderators & Staff</span>
            <span className="text-2xl sm:text-3xl font-black text-teal-700 block">
              {stats.users.moderators + stats.users.admins}
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.users.moderators} mods · {stats.users.admins} admins
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-gray-500 block">Hazard Reports</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 block">{stats.reports.total}</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-amber-700 font-bold">{stats.reports.active} active</span>
              <span className="text-teal-700 font-bold">· {stats.reports.resolved} resolved</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-gray-500 block">Citizen Verifications</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">
              {stats.reports.totalConfirms}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">
              {stats.reports.totalDisputes} citizen disputes
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-gray-500 block">System Health</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational (100%)</span>
            </div>
            <span className="text-[11px] text-gray-400 block pt-1">
              Memory: {stats.system.memoryUsageMb} MB · Node {process.version}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "users" ? "bg-teal-700 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{locale === "bn" ? "ব্যবহারকারী পরিচালনা" : "User Management"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">{users.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "audit" ? "bg-slate-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>{locale === "bn" ? "অ্যাডমিন অডিট লগ" : "Security & Audit Trail"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">{auditLogs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "config" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{locale === "bn" ? "সিস্টেম পলিসি কনফিগারেশন" : "System Policies"}</span>
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder={locale === "bn" ? "নাম বা ইমেইল দিয়ে নাগরিক খুঁজুন..." : "Search citizens by name or email..."}
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
              />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Showing {users.length} registered accounts
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Citizen Name / Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const regTime = formatTimestamp(u.createdAt);
                  const isCurrentAdmin = u.id === user.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-sm">{u.name}</div>
                        <div className="text-gray-500 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : u.role === "moderator"
                              ? "bg-teal-100 text-teal-800 border border-teal-200"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role === "admin" ? "👑 Admin" : u.role === "moderator" ? "🛡️ Moderator" : "👤 User"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {u.status === "active" ? "✓ Active" : "⛔ Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>{u.reportsSubmitted} reports</div>
                        <div className="text-[11px] text-gray-400">{u.verificationsCount} confirms</div>
                      </td>
                      <td className="py-3 px-4 text-gray-500" title={regTime.absolute}>
                        {regTime.relative}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-gray-400 italic">Current Session</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType("role");
                                setTargetRole(u.role === "user" ? "moderator" : u.role === "moderator" ? "admin" : "user");
                                setReason("");
                                setActionError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[11px] border border-teal-200 transition"
                            >
                              Change Role
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType("status");
                                setTargetStatus(u.status === "active" ? "suspended" : "active");
                                setReason("");
                                setActionError(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition ${
                                u.status === "active"
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {u.status === "active" ? "Suspend" : "Reactivate"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Audit Trail */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                {locale === "bn" ? "প্রশাসনিক অডিট ট্রেল ও সিকিউরিটি লগ" : "Administrative Audit Trail"}
              </h2>
              <p className="text-xs text-gray-500">
                All role elevations, account suspensions, and policy actions are permanently recorded.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              Showing {auditLogs.filter((log) => {
                if (auditActionFilter !== "all" && log.action !== auditActionFilter) return false;
                if (auditSearchQuery.trim()) {
                  const q = auditSearchQuery.toLowerCase();
                  return (
                    log.adminEmail?.toLowerCase().includes(q) ||
                    log.targetUserEmail?.toLowerCase().includes(q) ||
                    log.details?.toLowerCase().includes(q)
                  );
                }
                return true;
              }).length} of {auditLogs.length} entries
            </span>
          </div>

          {/* Audit filter bar (Audit Item 26) */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1 pb-2">
            <input
              type="text"
              placeholder={locale === "bn" ? "অ্যাডমিন বা টার্গেট ইমেল দিয়ে খুঁজুন..." : "Filter by email or keyword..."}
              value={auditSearchQuery}
              onChange={(e) => setAuditSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="all">All Actions</option>
              <option value="user_role_change">Role Changes</option>
              <option value="user_suspended">Suspensions</option>
              <option value="user_reactivated">Reactivations</option>
              <option value="report_moderated">Moderation Decisions</option>
            </select>
          </div>

          <div className="divide-y divide-gray-100">
            {auditLogs
              .filter((log) => {
                if (auditActionFilter !== "all" && log.action !== auditActionFilter) return false;
                if (auditSearchQuery.trim()) {
                  const q = auditSearchQuery.toLowerCase();
                  return (
                    log.adminEmail?.toLowerCase().includes(q) ||
                    log.targetUserEmail?.toLowerCase().includes(q) ||
                    log.details?.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((log) => {
                const aTime = formatTimestamp(log.createdAt);
                return (
                  <div key={log.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{log.action}</span>
                      </span>
                      <span className="text-[11px] text-gray-400" title={aTime.absolute}>
                        {aTime.relative}
                      </span>
                    </div>
                    <p className="text-gray-800">{log.details}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                      <span>Admin: <strong className="text-gray-600">{log.adminEmail}</strong></span>
                      {log.targetUserEmail && (
                        <span>Target: <strong className="text-gray-600">{log.targetUserEmail}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 3: System Policies */}
      {activeTab === "config" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <h2 className="font-bold text-gray-900 text-base">
            {locale === "bn" ? "সিস্টেম নিরাপত্তা ও অ্যান্টি-অ্যাবিউজ পলিসি" : "Civic Security & Guardrail Configurations"}
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="font-bold text-gray-900 block">Rate Limiting Thresholds</span>
              <p className="text-gray-600 text-xs leading-relaxed">
                Anonymous submissions capped at 5 reports/hour and 20 verifications/hour per hashed IP fingerprint.
                Brute-force login defense enforces an 8-attempt / 10-minute cooldown.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="font-bold text-gray-900 block">Salted IP Fingerprinting</span>
              <p className="text-gray-600 text-xs leading-relaxed">
                Raw IP addresses are never persisted in the database. Rotating daily salts guarantee that user movements cannot be tracked across days.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="font-bold text-gray-900 block">Password Security Standards</span>
              <p className="text-gray-600 text-xs leading-relaxed">
                PBKDF2 with SHA-512 over 100,000 iterations and unique 16-byte cryptographic salts. Resistance against offline dictionary attacks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog Modal with Mandatory Reason */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-black text-lg text-gray-900">
              {actionType === "role" ? "Change Citizen Role" : "Update Account Status"}
            </h3>

            <div className="p-3 bg-gray-50 rounded-2xl border text-xs space-y-1">
              <div className="font-bold text-gray-900">{selectedUser.name}</div>
              <div className="text-gray-500 font-mono">{selectedUser.email}</div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteUserAction} className="space-y-4">
              {actionType === "role" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Select New Role *
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="user">👤 User (Regular Citizen)</option>
                    <option value="moderator">🛡️ Moderator (Can verify & resolve hazards)</option>
                    <option value="admin">👑 Administrator (Full access & governance)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Target Status *
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="suspended">⛔ Suspended (Block login & reporting)</option>
                    <option value="active">✓ Active (Normal platform access)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Administrative Reason (Mandatory for Audit Trail) *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Verified local community volunteer appointed for Dhanmondi ward..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs transition disabled:opacity-50"
                >
                  {actionSubmitting ? "Processing..." : "Confirm & Log Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
