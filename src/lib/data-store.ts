import { ReportItem, ReportUpdateItem, VerificationEventItem, ModerationLogItem, AbuseReportItem, ReportCategory, ReportStatus } from "./types";
import { userStore } from "./user-store";

// Nirapod live in-memory store for citizen hazard reports
class NirapodDataStore {
  private reports: ReportItem[] = [];
  private updates: ReportUpdateItem[] = [];
  private verifications: VerificationEventItem[] = [];
  private moderationLogs: ModerationLogItem[] = [];
  private abuseReports: AbuseReportItem[] = [];

  // Haversine distance in kilometers
  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // String similarity (Dice's coefficient / bigram)
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const bigrams = new Map<string, number>();
    for (let i = 0; i < s1.length - 1; i++) {
      const bg = s1.substring(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < s2.length - 1; i++) {
      const bg = s2.substring(i, i + 2);
      const count = bigrams.get(bg) || 0;
      if (count > 0) {
        bigrams.set(bg, count - 1);
        intersection++;
      }
    }

    return (2.0 * intersection) / (s1.length - 1 + (s2.length - 1));
  }

  // Find duplicates
  findDuplicateCandidates(params: {
    latitude: number;
    longitude: number;
    category: ReportCategory;
    title: string;
    excludeId?: string;
    radiusKm?: number;
    withinHours?: number;
  }) {
    const { latitude, longitude, category, title, excludeId, radiusKm = 1.0, withinHours = 48 } = params;
    const cutoff = Date.now() - withinHours * 3600000;

    return this.reports
      .filter((r) => {
        if (excludeId && r.id === excludeId) return false;
        if (r.category !== category) return false;
        if (r.status === "archived") return false;
        const rTime = new Date(r.createdAt).getTime();
        if (rTime < cutoff) return false;

        const distanceKm = this.haversineDistanceKm(latitude, longitude, r.latitude, r.longitude);
        return distanceKm <= radiusKm;
      })
      .map((r) => {
        const distanceKm = this.haversineDistanceKm(latitude, longitude, r.latitude, r.longitude);
        const titleSimilarity = this.stringSimilarity(title, r.title);
        return {
          id: r.id,
          title: r.title,
          category: r.category,
          publicLocationDesc: r.publicLocationDesc || null,
          latitude: r.latitude,
          longitude: r.longitude,
          createdAt: new Date(r.createdAt),
          status: r.status,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          titleSimilarity: parseFloat(titleSimilarity.toFixed(2)),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }

  // Get filtered reports
  getReports(query: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: ReportCategory;
    status?: ReportStatus;
    sort?: "newest" | "nearest" | "recently_confirmed" | "unresolved";
    search?: string;
    reporterId?: string;
    page?: number;
    limit?: number;
  }) {
    const { lat, lng, radiusKm = 15, category, status, sort = "newest", search, reporterId, page = 1, limit = 20 } = query;

    let items = this.reports.filter((r) => r.status !== "archived" && r.status !== "rejected");

    if (reporterId) {
      items = items.filter((r) => r.reporterId === reporterId);
    }

    if (category) {
      items = items.filter((r) => r.category === category);
    }

    if (status) {
      if ((status as string) === "active") {
        items = this.reports.filter(
          (r) => r.status !== "resolved" && r.status !== "archived" && r.status !== "rejected"
        );
      } else {
        items = this.reports.filter((r) => r.status === status);
      }
    }

    if (sort === "unresolved") {
      items = items.filter((r) => r.status !== "resolved");
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      // Item 22: Bilingual expansion
      const BILINGUAL_ALIASES: Record<string, string> = {
        "ধানমন্ডি": "dhanmondi", "dhanmondi": "ধানমন্ডি",
        "মিরপুর": "mirpur", "mirpur": "মিরপুর",
        "গুলশান": "gulshan", "gulshan": "গুলশান",
        "উত্তরা": "uttara", "uttara": "উত্তরা",
        "ফার্মগেট": "farmgate", "farmgate": "ফার্মগেট",
        "মালিবাগ": "malibagh", "malibagh": "মালিবাগ",
        "পুরান ঢাকা": "old dhaka", "old dhaka": "পুরান ঢাকা",
        "বনানী": "banani", "banani": "বনানী",
        "মহাখালী": "mohakhali", "mohakhali": "মহাখালী",
        "জলাবদ্ধতা": "waterlogging", "waterlogging": "জলাবদ্ধতা",
        "যানজট": "traffic", "traffic": "যানজট",
      };

      const alias = BILINGUAL_ALIASES[q] || "";

      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.publicLocationDesc && r.publicLocationDesc.toLowerCase().includes(q)) ||
          (r.nearbyLandmark && r.nearbyLandmark.toLowerCase().includes(q)) ||
          (alias && (
            r.title.toLowerCase().includes(alias) ||
            r.description.toLowerCase().includes(alias) ||
            (r.publicLocationDesc && r.publicLocationDesc.toLowerCase().includes(alias))
          ))
      );
    }

    // Proximity filtering if lat/lng are provided
    if (lat !== undefined && lng !== undefined) {
      items = items
        .map((r) => ({
          ...r,
          distanceKm: parseFloat(this.haversineDistanceKm(lat, lng, r.latitude, r.longitude).toFixed(2)),
        }))
        .filter((r) => r.distanceKm <= radiusKm);

      if (sort === "nearest") {
        items.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
      } else if (sort === "recently_confirmed") {
        items.sort((a, b) => {
          const timeA = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : new Date(a.createdAt).getTime();
          const timeB = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      } else {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } else {
      if (sort === "recently_confirmed") {
        items.sort((a, b) => {
          const timeA = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : new Date(a.createdAt).getTime();
          const timeB = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      } else {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    const total = items.length;
    const offset = (page - 1) * limit;
    const paginated = items.slice(offset, offset + limit);

    return {
      reports: paginated,
      total,
      page,
      limit,
    };
  }

  // Get single report
  getReportById(id: string) {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;

    const updates = this.updates
      .filter((u) => u.reportId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      ...report,
      updates,
    };
  }

  // Create report
  createReport(data: {
    title: string;
    description: string;
    category: ReportCategory;
    latitude: number;
    longitude: number;
    publicLocationDesc?: string | null;
    nearbyLandmark?: string | null;
    reporterId?: string | null;
    anonFingerprint?: string | null;
    observedAt?: string | null;
    expectedResolutionAt?: string | null;
    coverPhoto?: { id: string; publicUrl: string } | null;
  }): ReportItem {
    const now = new Date().toISOString();
    const newReport: ReportItem = {
      id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      reporterId: data.reporterId || null,
      anonFingerprint: data.anonFingerprint || null,
      title: data.title,
      description: data.description,
      category: data.category,
      latitude: data.latitude,
      longitude: data.longitude,
      publicLocationDesc: data.publicLocationDesc || null,
      nearbyLandmark: data.nearbyLandmark || null,
      status: "submitted",
      confirmCount: 1, // Author confirmation count
      disputeCount: 0,
      observedAt: data.observedAt || now,
      expectedResolutionAt: data.expectedResolutionAt || null,
      lastConfirmedAt: now,
      createdAt: now,
      updatedAt: now,
      coverPhoto: data.coverPhoto || null,
    };

    this.reports.unshift(newReport);
    return newReport;
  }

  // Verify / dispute / resolve
  addVerification(data: {
    reportId: string;
    result: "confirm" | "dispute" | "resolved";
    contributorId?: string | null;
    anonFingerprint?: string | null;
  }) {
    const report = this.reports.find((r) => r.id === data.reportId);
    if (!report) return null;

    // Item 31: Prevent self-verification (author cannot verify own report)
    if (data.contributorId && report.reporterId && report.reporterId === data.contributorId) {
      return { report, event: null, alreadyVerified: false, selfVerification: true };
    }

    // Item 18: Disallow verification on closed or inactive reports
    if (report.status === "resolved" || report.status === "archived" || report.status === "rejected") {
      return { report, event: null, alreadyVerified: false, reportClosed: true };
    }

    // Item 7: Prevent ballot-stuffing / duplicate votes from same contributor or fingerprint
    const alreadyVerified = this.verifications.some(
      (v) =>
        v.reportId === data.reportId &&
        ((data.contributorId && v.contributorId === data.contributorId) ||
          (data.anonFingerprint && v.anonFingerprint === data.anonFingerprint))
    );

    if (alreadyVerified) {
      return { report, event: null, alreadyVerified: true };
    }

    const event: VerificationEventItem = {
      id: `ver-${Date.now().toString(36)}`,
      reportId: data.reportId,
      contributorId: data.contributorId || null,
      anonFingerprint: data.anonFingerprint || null,
      result: data.result,
      createdAt: new Date().toISOString(),
    };
    this.verifications.push(event);

    const now = new Date().toISOString();
    if (data.result === "confirm") {
      report.confirmCount += 1;
      report.lastConfirmedAt = now;
      if (report.confirmCount >= 3 && report.status === "submitted") {
        report.status = "community_confirmed";
      }
    } else if (data.result === "dispute") {
      report.disputeCount += 1;
      // Item 9: Ratio-based dispute threshold (requires significant proportion and min 3 disputes)
      const totalVotes = report.confirmCount + report.disputeCount;
      const disputeRatio = report.disputeCount / (totalVotes || 1);
      if (report.disputeCount >= 3 && disputeRatio >= 0.35 && report.status === "community_confirmed") {
        report.status = "disputed";
      }
    } else if (data.result === "resolved") {
      // Item 17: Community resolved consensus requires min 3 distinct resolve votes
      if (!report.resolvedVotes) report.resolvedVotes = [];
      const voterKey = data.contributorId || data.anonFingerprint || "anon";
      if (!report.resolvedVotes.includes(voterKey)) {
        report.resolvedVotes.push(voterKey);
      }
      if (report.resolvedVotes.length >= 3 && report.disputeCount <= 1) {
        report.status = "resolved";
        report.resolvedAt = now;
      }
    }

    report.updatedAt = now;
    return { report, event, alreadyVerified: false };
  }

  // Add community update
  addUpdate(data: {
    reportId: string;
    description: string;
    updateType: "general" | "status_update" | "severity_change" | "partial_resolution" | "resolution";
    photoUrl?: string | null;
    contributorId?: string | null;
    anonFingerprint?: string | null;
  }) {
    const report = this.reports.find((r) => r.id === data.reportId);
    if (!report) return null;

    const now = new Date().toISOString();
    const update: ReportUpdateItem = {
      id: `upd-${Date.now().toString(36)}`,
      reportId: data.reportId,
      contributorId: data.contributorId || null,
      anonFingerprint: data.anonFingerprint || null,
      updateType: data.updateType,
      description: data.description,
      photoUrl: data.photoUrl || null,
      status: "active",
      createdAt: now,
    };

    this.updates.unshift(update);
    report.updatedAt = now;
    report.lastConfirmedAt = now; // updates refresh freshness

    return update;
  }

  // Item 21: Moderator update action (hide/restore)
  moderateUpdate(updateId: string, action: "hide" | "restore") {
    const update = this.updates.find((u) => u.id === updateId);
    if (!update) return null;
    update.status = action === "hide" ? "hidden" : "active";
    return update;
  }

  // Item 33: Automated retention & archival worker
  archiveStaleResolvedReports(days: number = 30): { archivedCount: number } {
    const cutoff = Date.now() - days * 24 * 3600000;
    let archivedCount = 0;

    for (const report of this.reports) {
      if (report.status === "resolved" && report.resolvedAt) {
        if (new Date(report.resolvedAt).getTime() < cutoff) {
          report.status = "archived";
          report.archivedAt = new Date().toISOString();
          archivedCount++;
        }
      }
    }

    return { archivedCount };
  }

  // Moderate report
  moderateReport(params: {
    reportId: string;
    action: "approve" | "reject" | "archive" | "resolve" | "change_status";
    status?: ReportStatus;
    reason: string;
    moderatorId: string;
  }) {
    const report = this.reports.find((r) => r.id === params.reportId);
    if (!report) return null;

    const prevStatus = report.status;
    let nextStatus = report.status;

    if (params.status) {
      nextStatus = params.status;
    } else if (params.action === "approve") {
      nextStatus = "community_confirmed";
    } else if (params.action === "resolve") {
      nextStatus = "resolved";
      report.resolvedAt = new Date().toISOString();
    } else if (params.action === "archive") {
      nextStatus = "archived";
      report.archivedAt = new Date().toISOString();
    } else if (params.action === "reject") {
      nextStatus = "rejected";
      // Item 34: Deduct reputation from author on rejected fake/spam report
      if (report.reporterId) {
        userStore.deductCivicPoints(report.reporterId, 35, params.reason);
      }
    }

    report.status = nextStatus;
    report.updatedAt = new Date().toISOString();

    const log: ModerationLogItem = {
      id: `mod-${Date.now().toString(36)}`,
      moderatorId: params.moderatorId,
      reportId: params.reportId,
      action: params.action,
      reason: params.reason,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      createdAt: new Date().toISOString(),
    };

    this.moderationLogs.unshift(log);
    return { report, log };
  }

  // Get moderation logs
  getModerationLogs() {
    return this.moderationLogs;
  }

  // Add abuse report
  addAbuseReport(data: {
    targetReportId?: string;
    targetUpdateId?: string;
    reason: string;
    details?: string;
    reportedByUserId?: string;
  }) {
    const abuse: AbuseReportItem = {
      id: `abuse-${Date.now().toString(36)}`,
      targetReportId: data.targetReportId || null,
      targetUpdateId: data.targetUpdateId || null,
      reason: data.reason,
      details: data.details || null,
      reportedByUserId: data.reportedByUserId || null,
      reviewStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    this.abuseReports.unshift(abuse);

    // If report has 3 or more abuse reports, auto-flag for review
    if (data.targetReportId) {
      const count = this.abuseReports.filter((a) => a.targetReportId === data.targetReportId).length;
      if (count >= 2) {
        const report = this.reports.find((r) => r.id === data.targetReportId);
        if (report && report.status !== "resolved" && report.status !== "archived") {
          report.status = "under_review";
        }
      }
    }

    return abuse;
  }

  // Get abuse reports
  getAbuseReports() {
    return this.abuseReports;
  }
}

// Global singleton instance
declare global {
  // eslint-disable-next-line no-var
  var _nirapodDataStore: NirapodDataStore | undefined;
}

if (!global._nirapodDataStore) {
  global._nirapodDataStore = new NirapodDataStore();
}

export const dataStore = global._nirapodDataStore;
