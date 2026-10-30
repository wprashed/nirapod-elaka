import { ReportCategory, ReportStatus } from "./validation";

// ─── Category metadata ────────────────────────────────────────────────────────

export interface CategoryMeta {
  key: ReportCategory;
  labelEn: string;
  labelBn: string;
  icon: string;       // Emoji — also used as aria-label fallback
  color: string;      // Tailwind color class (bg-*)
  markerColor: string; // CSS hex for Leaflet DivIcon
}

export const CATEGORY_META: Record<ReportCategory, CategoryMeta> = {
  waterlogging: {
    key: "waterlogging",
    labelEn: "Waterlogging / Flooding",
    labelBn: "জলাবদ্ধতা / বন্যা",
    icon: "💧",
    color: "bg-blue-100 text-blue-800",
    markerColor: "#2563EB",
  },
  blocked_road: {
    key: "blocked_road",
    labelEn: "Blocked Road",
    labelBn: "অবরুদ্ধ রাস্তা",
    icon: "🚧",
    color: "bg-orange-100 text-orange-800",
    markerColor: "#EA580C",
  },
  damaged_road: {
    key: "damaged_road",
    labelEn: "Damaged Road",
    labelBn: "ক্ষতিগ্রস্ত রাস্তা",
    icon: "⚠️",
    color: "bg-amber-100 text-amber-800",
    markerColor: "#D97706",
  },
  fallen_tree: {
    key: "fallen_tree",
    labelEn: "Fallen Tree",
    labelBn: "পড়ে যাওয়া গাছ",
    icon: "🌳",
    color: "bg-green-100 text-green-800",
    markerColor: "#16A34A",
  },
  traffic_disruption: {
    key: "traffic_disruption",
    labelEn: "Traffic Disruption",
    labelBn: "যানজট / যানবাহন বিঘ্ন",
    icon: "🚗",
    color: "bg-yellow-100 text-yellow-800",
    markerColor: "#CA8A04",
  },
  infrastructure_damage: {
    key: "infrastructure_damage",
    labelEn: "Infrastructure Damage",
    labelBn: "অবকাঠামো ক্ষতি",
    icon: "🏗️",
    color: "bg-stone-100 text-stone-800",
    markerColor: "#78716C",
  },
  utility_disruption: {
    key: "utility_disruption",
    labelEn: "Utility Disruption",
    labelBn: "ইউটিলিটি বিঘ্ন",
    icon: "⚡",
    color: "bg-purple-100 text-purple-800",
    markerColor: "#7C3AED",
  },
  pedestrian_safety: {
    key: "pedestrian_safety",
    labelEn: "Pedestrian Safety",
    labelBn: "পথচারী নিরাপত্তা",
    icon: "🚶",
    color: "bg-red-100 text-red-800",
    markerColor: "#DC2626",
  },
  other: {
    key: "other",
    labelEn: "Other",
    labelBn: "অন্যান্য",
    icon: "📌",
    color: "bg-gray-100 text-gray-800",
    markerColor: "#6B7280",
  },
};

// ─── Status metadata ──────────────────────────────────────────────────────────

export interface StatusMeta {
  key: ReportStatus;
  labelEn: string;
  labelBn: string;
  color: string;  // Tailwind badge color
  description: string;
}

export const STATUS_META: Record<ReportStatus, StatusMeta> = {
  submitted: {
    key: "submitted",
    labelEn: "Submitted",
    labelBn: "জমা দেওয়া হয়েছে",
    color: "bg-gray-100 text-gray-700",
    description: "Report has been submitted and awaits review.",
  },
  under_review: {
    key: "under_review",
    labelEn: "Under Review",
    labelBn: "পর্যালোচনাধীন",
    color: "bg-blue-100 text-blue-700",
    description: "Report is being reviewed by moderators.",
  },
  community_confirmed: {
    key: "community_confirmed",
    labelEn: "Community Confirmed",
    labelBn: "সম্প্রদায় নিশ্চিত",
    color: "bg-green-100 text-green-700",
    description: "Multiple community members have confirmed this report.",
  },
  disputed: {
    key: "disputed",
    labelEn: "Disputed",
    labelBn: "বিতর্কিত",
    color: "bg-amber-100 text-amber-700",
    description: "This report has conflicting information.",
  },
  resolved: {
    key: "resolved",
    labelEn: "Resolved",
    labelBn: "সমাধান হয়েছে",
    color: "bg-teal-100 text-teal-700",
    description: "This hazard has been resolved.",
  },
  archived: {
    key: "archived",
    labelEn: "Archived",
    labelBn: "সংরক্ষিত",
    color: "bg-gray-100 text-gray-500",
    description: "This report has been archived.",
  },
  rejected: {
    key: "rejected",
    labelEn: "Rejected / Spam",
    labelBn: "বাতিল / স্প্যাম",
    color: "bg-rose-100 text-rose-700",
    description: "This report has been rejected by civic moderators.",
  },
};

// ─── Number & Time helpers ───────────────────────────────────────────────────

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/**
 * Convert ASCII arabic numerals (0-9) to Bengali numerals (০-৯).
 */
export function toBengaliNumerals(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

/**
 * Format a Date as both relative ("2 hours ago" / "২ ঘণ্টা আগে") and absolute (BST).
 */
export function formatTimestamp(
  date: Date | string | null | undefined,
  locale: "en" | "bn" = "en"
): {
  relative: string;
  absolute: string;
} {
  if (!date) {
    return {
      relative: locale === "bn" ? "অজানা" : "Unknown",
      absolute: locale === "bn" ? "অজানা সময়" : "Unknown",
    };
  }
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  let relative: string;
  if (locale === "bn") {
    if (diffMin < 1) relative = "এইমাত্র";
    else if (diffMin < 60) relative = `${toBengaliNumerals(diffMin)} মিনিট আগে`;
    else if (diffHr < 24) relative = `${toBengaliNumerals(diffHr)} ঘণ্টা আগে`;
    else if (diffDay < 7) relative = `${toBengaliNumerals(diffDay)} দিন আগে`;
    else relative = d.toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka" });
  } else {
    if (diffMin < 1) relative = "Just now";
    else if (diffMin < 60) relative = `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    else if (diffHr < 24) relative = `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    else if (diffDay < 7) relative = `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
    else relative = d.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" });
  }

  const absolute =
    locale === "bn"
      ? d.toLocaleString("bn-BD", {
          timeZone: "Asia/Dhaka",
          dateStyle: "medium",
          timeStyle: "short",
        }) + " (বিএসটি)"
      : d.toLocaleString("en-GB", {
          timeZone: "Asia/Dhaka",
          dateStyle: "medium",
          timeStyle: "short",
        }) + " BST";

  return { relative, absolute };
}

/**
 * Returns true if a report was last confirmed more than staleHours ago
 * and the report is still active.
 */
export function isStale(
  lastConfirmedAt: Date | null | undefined,
  createdAt: Date | string,
  staleHours = 24
): boolean {
  const ref = lastConfirmedAt ?? (typeof createdAt === "string" ? new Date(createdAt) : createdAt);
  return Date.now() - ref.getTime() > staleHours * 3600000;
}
