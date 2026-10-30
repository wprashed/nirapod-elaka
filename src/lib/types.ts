import { REPORT_CATEGORIES, REPORT_STATUSES } from "./validation";

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface ReportItem {
  id: string;
  reporterId?: string | null;
  anonFingerprint?: string | null;
  title: string;
  description: string;
  titleBn?: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  publicLocationDesc?: string | null;
  nearbyLandmark?: string | null;
  publicLocationDescBn?: string;
  publicLocationDescEn?: string;
  nearbyLandmarkBn?: string;
  nearbyLandmarkEn?: string;
  status: ReportStatus;
  confirmCount: number;
  disputeCount: number;
  resolvedVotes?: string[];
  observedAt?: string | null;
  expectedResolutionAt?: string | null;
  resolvedAt?: string | null;
  lastConfirmedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  coverPhoto?: {
    id: string;
    publicUrl: string;
  } | null;
  newsSource?: {
    name: string;
    url: string;
    publishedAt?: string;
  } | null;
}

export interface ReportUpdateItem {
  id: string;
  reportId: string;
  contributorId?: string | null;
  anonFingerprint?: string | null;
  updateType: "general" | "status_update" | "severity_change" | "partial_resolution" | "resolution";
  description: string;
  photoUrl?: string | null;
  status?: "active" | "hidden";
  createdAt: string;
}

export interface VerificationEventItem {
  id: string;
  reportId: string;
  contributorId?: string | null;
  anonFingerprint?: string | null;
  result: "confirm" | "dispute" | "resolved";
  createdAt: string;
}

export interface ModerationLogItem {
  id: string;
  moderatorId: string;
  reportId?: string | null;
  action: string;
  reason: string;
  previousStatus?: ReportStatus | null;
  newStatus?: ReportStatus | null;
  createdAt: string;
}

export interface AbuseReportItem {
  id: string;
  targetReportId?: string | null;
  targetUpdateId?: string | null;
  reportedByUserId?: string | null;
  reason: string;
  details?: string | null;
  submissionMeta?: string | null;
  reviewStatus: "pending" | "reviewed" | "actioned" | "dismissed";
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  createdAt: string;
}
