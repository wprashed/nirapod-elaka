import { z } from "zod";

// ─── Shared constants ─────────────────────────────────────────────────────────

export const REPORT_CATEGORIES = [
  "waterlogging",
  "blocked_road",
  "damaged_road",
  "fallen_tree",
  "traffic_disruption",
  "infrastructure_damage",
  "utility_disruption",
  "pedestrian_safety",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = [
  "submitted",
  "under_review",
  "community_confirmed",
  "disputed",
  "resolved",
  "archived",
  "rejected",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const QUERY_STATUSES = [
  ...REPORT_STATUSES,
  "active",
] as const;

export type QueryStatus = (typeof QUERY_STATUSES)[number];

// ─── Report creation ──────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .trim(),
  category: z.enum(REPORT_CATEGORIES),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  publicLocationDesc: z.string().max(300).trim().optional(),
  nearbyLandmark: z.string().max(200).trim().optional(),
  observedAt: z
    .string()
    .datetime()
    .refine(
      (val) => !val || new Date(val).getTime() <= Date.now() + 60000,
      "Observation time cannot be in the future"
    )
    .optional(),
  expectedResolutionAt: z.string().datetime().optional(),
  coverPhotoId: z.string().optional(),
  coverPhoto: z
    .object({
      id: z.string(),
      publicUrl: z.string(),
    })
    .optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ─── Verification ─────────────────────────────────────────────────────────────

export const verificationSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  result: z.enum(["confirm", "dispute", "resolved"]),
});

export type VerificationInput = z.infer<typeof verificationSchema>;

// ─── Community update ─────────────────────────────────────────────────────────

export const createUpdateSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  updateType: z.enum(["general", "status_update", "severity_change", "partial_resolution", "resolution"]),
  description: z
    .string()
    .min(5, "Update must be at least 5 characters")
    .max(500, "Update must be at most 500 characters")
    .trim(),
  photoUrl: z.string().optional(),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;

// ─── Abuse report ─────────────────────────────────────────────────────────────

export const abuseReportSchema = z.object({
  targetReportId: z.string().min(1).optional(),
  targetUpdateId: z.string().min(1).optional(),
  reason: z.string().min(3).max(100),
  details: z.string().max(1000).trim().optional(),
}).refine((d) => d.targetReportId || d.targetUpdateId, {
  message: "Must target a report or an update",
});

// ─── Query params ─────────────────────────────────────────────────────────────

export const reportsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
  category: z.enum(REPORT_CATEGORIES).optional(),
  status: z.enum(QUERY_STATUSES).optional(),
  sort: z.enum(["newest", "nearest", "recently_confirmed", "unresolved"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
