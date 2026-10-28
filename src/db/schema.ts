import { pgTable, uuid, text, varchar, timestamp, integer, doublePrecision, boolean, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["user", "moderator", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deleted"]);

export const reportCategoryEnum = pgEnum("report_category", [
  "waterlogging",
  "blocked_road",
  "damaged_road",
  "fallen_tree",
  "traffic_disruption",
  "infrastructure_damage",
  "utility_disruption",
  "pedestrian_safety",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "submitted",
  "under_review",
  "community_confirmed",
  "disputed",
  "resolved",
  "archived",
]);

export const verificationResultEnum = pgEnum("verification_result", [
  "confirm",
  "dispute",
  "resolved",
]);

export const updateTypeEnum = pgEnum("update_type", [
  "general",
  "status_update",
  "severity_change",
  "partial_resolution",
  "resolution",
]);

export const photoModerationStatusEnum = pgEnum("photo_moderation_status", [
  "pending",
  "approved",
  "rejected",
]);

export const moderationActionEnum = pgEnum("moderation_action", [
  "approve",
  "reject",
  "archive",
  "resolve",
  "suspend_user",
  "unsuspend_user",
  "remove_photo",
  "flag_duplicate",
  "change_status",
]);

export const abuseReviewStatusEnum = pgEnum("abuse_review_status", [
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  role: userRoleEnum("role").notNull().default("user"),
  status: userStatusEnum("status").notNull().default("active"),
  // Stores provider-specific tokens (NextAuth adapter uses sessions table)
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}));

// NextAuth adapter tables
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => ({
  providerIdx: uniqueIndex("accounts_provider_idx").on(t.provider, t.providerAccountId),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 500 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => ({
  pk: uniqueIndex("verification_tokens_pk").on(t.identifier, t.token),
}));

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  // Anonymous reporters: store a hashed IP fingerprint for rate limiting
  anonFingerprint: varchar("anon_fingerprint", { length: 64 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: reportCategoryEnum("category").notNull(),
  // Geospatial: stored as lat/lng columns; PostGIS geography column added via raw migration
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  // Human-readable location (public, may differ from exact coords)
  publicLocationDesc: varchar("public_location_desc", { length: 300 }),
  // Optional nearby landmark for context
  nearbyLandmark: varchar("nearby_landmark", { length: 200 }),
  status: reportStatusEnum("status").notNull().default("submitted"),
  // Number of confirms minus disputes
  confirmCount: integer("confirm_count").notNull().default(0),
  disputeCount: integer("dispute_count").notNull().default(0),
  // Approximate time the hazard was observed (may differ from created_at)
  observedAt: timestamp("observed_at", { withTimezone: true }),
  expectedResolutionAt: timestamp("expected_resolution_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Geospatial index (functional) — lat/lng bounding box
  latLngIdx: index("reports_lat_lng_idx").on(t.latitude, t.longitude),
  statusCreatedIdx: index("reports_status_created_idx").on(t.status, t.createdAt),
  categoryIdx: index("reports_category_idx").on(t.category),
  reporterIdx: index("reports_reporter_idx").on(t.reporterId),
}));

// ─── Report Updates ───────────────────────────────────────────────────────────

export const reportUpdates = pgTable("report_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  contributorId: uuid("contributor_id").references(() => users.id, { onDelete: "set null" }),
  anonFingerprint: varchar("anon_fingerprint", { length: 64 }),
  updateType: updateTypeEnum("update_type").notNull().default("general"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  reportIdx: index("report_updates_report_idx").on(t.reportId),
}));

// ─── Report Photos ────────────────────────────────────────────────────────────

export const reportPhotos = pgTable("report_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  // Public URL (may be CDN URL or local path in dev)
  publicUrl: text("public_url"),
  mimeType: varchar("mime_type", { length: 50 }),
  sizeBytes: integer("size_bytes"),
  moderationStatus: photoModerationStatusEnum("moderation_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  reportIdx: index("report_photos_report_idx").on(t.reportId),
}));

// ─── Verification Events ──────────────────────────────────────────────────────

export const verificationEvents = pgTable("verification_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  contributorId: uuid("contributor_id").references(() => users.id, { onDelete: "set null" }),
  // Hash of IP for anonymous deduplication — never store raw IPs
  anonFingerprint: varchar("anon_fingerprint", { length: 64 }),
  result: verificationResultEnum("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  reportIdx: index("verification_events_report_idx").on(t.reportId),
  // Prevent duplicate authenticated verifications for the same report
  uniqueContributorReport: uniqueIndex("verification_events_unique_contributor")
    .on(t.reportId, t.contributorId)
    .where(sql`contributor_id IS NOT NULL`),
}));

// ─── Moderation Logs ──────────────────────────────────────────────────────────

export const moderationLogs = pgTable("moderation_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  moderatorId: uuid("moderator_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: moderationActionEnum("action").notNull(),
  reason: text("reason"),
  previousStatus: reportStatusEnum("previous_status"),
  newStatus: reportStatusEnum("new_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  moderatorIdx: index("moderation_logs_moderator_idx").on(t.moderatorId),
  reportIdx: index("moderation_logs_report_idx").on(t.reportId),
  createdIdx: index("moderation_logs_created_idx").on(t.createdAt),
}));

// ─── Abuse Reports ────────────────────────────────────────────────────────────

export const abuseReports = pgTable("abuse_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetReportId: uuid("target_report_id").references(() => reports.id, { onDelete: "cascade" }),
  targetUpdateId: uuid("target_update_id").references(() => reportUpdates.id, { onDelete: "cascade" }),
  reportedByUserId: uuid("reported_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  // Hashed metadata for anonymous submissions
  submissionMeta: varchar("submission_meta", { length: 64 }),
  reviewStatus: abuseReviewStatusEnum("review_status").notNull().default("pending"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("abuse_reports_status_idx").on(t.reviewStatus),
}));

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportUpdate = typeof reportUpdates.$inferSelect;
export type NewReportUpdate = typeof reportUpdates.$inferInsert;
export type ReportPhoto = typeof reportPhotos.$inferSelect;
export type VerificationEvent = typeof verificationEvents.$inferSelect;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type AbuseReport = typeof abuseReports.$inferSelect;
