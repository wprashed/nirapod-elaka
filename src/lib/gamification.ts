/**
 * NirapodElaka Civic Gamification & Reputation Engine
 *
 * Designed to motivate responsible, accurate, and constructive civic participation
 * without creating competitive spam incentives. Rewards verified contributions,
 * prompt updates, and ground truth accuracy.
 */

export interface Badge {
  id: string;
  icon: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  category: "reporting" | "verification" | "accuracy" | "impact";
  requiredPoints?: number;
}

export interface GamificationTier {
  level: number;
  minPoints: number;
  maxPoints: number;
  titleEn: string;
  titleBn: string;
  badgeIcon: string;
  color: string;
}

export const GAMIFICATION_TIERS: GamificationTier[] = [
  {
    level: 1,
    minPoints: 0,
    maxPoints: 49,
    titleEn: "Neighborhood Neighbor",
    titleBn: "পাড়া প্রতিবেশী",
    badgeIcon: "🌱",
    color: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  {
    level: 2,
    minPoints: 50,
    maxPoints: 149,
    titleEn: "Dhaka Scout",
    titleBn: "ঢাকা স্কাউট",
    badgeIcon: "🧭",
    color: "bg-teal-50 text-teal-800 border-teal-300",
  },
  {
    level: 3,
    minPoints: 150,
    maxPoints: 349,
    titleEn: "Civic Guardian",
    titleBn: "নাগরিক অভিভাবক",
    badgeIcon: "🛡️",
    color: "bg-blue-50 text-blue-800 border-blue-300",
  },
  {
    level: 4,
    minPoints: 350,
    maxPoints: 699,
    titleEn: "City Sentinel",
    titleBn: "নগর প্রহরী",
    badgeIcon: "⭐",
    color: "bg-purple-50 text-purple-800 border-purple-300",
  },
  {
    level: 5,
    minPoints: 700,
    maxPoints: 999999,
    titleEn: "Urban Champion",
    titleBn: "শহর রক্ষক",
    badgeIcon: "👑",
    color: "bg-amber-50 text-amber-900 border-amber-300",
  },
];

export const BADGES: Badge[] = [
  {
    id: "first_alert",
    icon: "🌱",
    titleEn: "First Alert",
    titleBn: "প্রথম সঙ্কেত",
    descriptionEn: "Submitted your first local hazard report",
    descriptionBn: "আপনার প্রথম নাগরিক হ্যাজার্ড রিপোর্ট জমা দিয়েছেন",
    category: "reporting",
  },
  {
    id: "flood_scout",
    icon: "💧",
    titleEn: "Flood Scout",
    titleBn: "জলপ্রহরী",
    descriptionEn: "Reported or verified waterlogging and flooding",
    descriptionBn: "জলাবদ্ধতা বা বৃষ্টির ভোগান্তি সতর্ক করেছেন",
    category: "reporting",
  },
  {
    id: "route_guardian",
    icon: "🚧",
    titleEn: "Route Guardian",
    titleBn: "পথের দিশারী",
    descriptionEn: "Reported road damage, fallen trees, or traffic blocks",
    descriptionBn: "ভাঙা রাস্তা, গাছ উপড়ে পড়া বা ট্রাফিক প্রতিবন্ধকতা সতর্ক করেছেন",
    category: "reporting",
  },
  {
    id: "truth_sentinel",
    icon: "🔍",
    titleEn: "Truth Sentinel",
    titleBn: "সত্যায়ন প্রহরী",
    descriptionEn: "Contributed 3+ confirmations to keep reports accurate",
    descriptionBn: "৩+ রিপোর্ট সরেজমিনে নিশ্চিত করে তথ্য নির্ভুল রেখেছেন",
    category: "verification",
  },
  {
    id: "live_reporter",
    icon: "⚡",
    titleEn: "Live Reporter",
    titleBn: "তাজা খবর",
    descriptionEn: "Posted timely on-the-ground updates on active hazards",
    descriptionBn: "চলমান হ্যাজার্ডের তাৎক্ষণিক নতুন তথ্য ও আপডেট দিয়েছেন",
    category: "impact",
  },
  {
    id: "dhaka_hero",
    icon: "🏆",
    titleEn: "Dhaka Hero",
    titleBn: "ঢাকা হিরো",
    descriptionEn: "Earned 150+ civic points helping commuters navigate safely",
    descriptionBn: "১৫০+ নাগরিক পয়েন্ট অর্জন করে নগরবাসীকে সুরক্ষিত রেখেছেন",
    category: "impact",
    requiredPoints: 150,
  },
];

export const POINT_VALUES = {
  SUBMIT_REPORT: 25,
  SUBMIT_WITH_PHOTO_BONUS: 10,
  CONFIRM_HAZARD: 10,
  SUBMIT_UPDATE: 15,
  REPORT_RESOLVED_BONUS: 20,
};

export function getTierForPoints(points: number): GamificationTier {
  for (let i = GAMIFICATION_TIERS.length - 1; i >= 0; i--) {
    if (points >= GAMIFICATION_TIERS[i].minPoints) {
      return GAMIFICATION_TIERS[i];
    }
  }
  return GAMIFICATION_TIERS[0];
}

export function getNextTier(currentTier: GamificationTier): GamificationTier | null {
  const currentIndex = GAMIFICATION_TIERS.findIndex((t) => t.level === currentTier.level);
  if (currentIndex >= 0 && currentIndex < GAMIFICATION_TIERS.length - 1) {
    return GAMIFICATION_TIERS[currentIndex + 1];
  }
  return null;
}

export interface GamificationProfile {
  civicPoints: number;
  currentTier: GamificationTier;
  nextTier: GamificationTier | null;
  progressPercent: number;
  pointsToNextTier: number;
  earnedBadges: Badge[];
  lockedBadges: Badge[];
  streakDays: number;
  estimatedCommutersHelped: number;
  reportsSubmitted: number;
  verificationsCount: number;
}

/**
 * Compute user's complete gamification summary
 */
export function computeGamification(params: {
  points: number;
  reportsCount: number;
  verificationsCount: number;
  updatesCount?: number;
  hasPhoto?: boolean;
  categoriesReported?: string[];
  streakDays?: number;
}): GamificationProfile {
  const points = Math.max(0, params.points || 0);
  const reportsCount = params.reportsCount || 0;
  const verificationsCount = params.verificationsCount || 0;
  const updatesCount = params.updatesCount || 0;
  const categories = params.categoriesReported || [];

  const currentTier = getTierForPoints(points);
  const nextTier = getNextTier(currentTier);

  let progressPercent = 100;
  let pointsToNextTier = 0;

  if (nextTier) {
    const range = nextTier.minPoints - currentTier.minPoints;
    const currentInRange = points - currentTier.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
    pointsToNextTier = Math.max(0, nextTier.minPoints - points);
  }

  // Determine unlocked badges
  const earnedBadgeIds = new Set<string>();
  if (reportsCount >= 1) earnedBadgeIds.add("first_alert");
  if (categories.includes("waterlogging") || reportsCount >= 2) earnedBadgeIds.add("flood_scout");
  if (categories.some((c) => ["blocked_road", "damaged_road", "fallen_tree", "traffic_disruption"].includes(c))) {
    earnedBadgeIds.add("route_guardian");
  }
  if (verificationsCount >= 3) earnedBadgeIds.add("truth_sentinel");
  if (updatesCount >= 1 || verificationsCount >= 5) earnedBadgeIds.add("live_reporter");
  if (points >= 150) earnedBadgeIds.add("dhaka_hero");

  const earnedBadges = BADGES.filter((b) => earnedBadgeIds.has(b.id));
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.has(b.id));

  // Impact: each verified report/confirmation safely guides an estimated 35-70 commuters
  const estimatedCommutersHelped = Math.max(
    12,
    reportsCount * 45 + verificationsCount * 18 + updatesCount * 25
  );

  return {
    civicPoints: points,
    currentTier,
    nextTier,
    progressPercent,
    pointsToNextTier,
    earnedBadges,
    lockedBadges,
    streakDays: params.streakDays || 1,
    estimatedCommutersHelped,
    reportsSubmitted: reportsCount,
    verificationsCount,
  };
}
