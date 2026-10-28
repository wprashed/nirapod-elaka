import { describe, it, expect } from "vitest";
import { computeGamification, getTierForPoints, GAMIFICATION_TIERS } from "@/lib/gamification";

describe("Civic Gamification & Reputation Engine", () => {
  it("computes Level 1 for a new user with 0 points", () => {
    const profile = computeGamification({
      points: 0,
      reportsCount: 0,
      verificationsCount: 0,
    });

    expect(profile.currentTier.level).toBe(1);
    expect(profile.currentTier.titleEn).toBe("Neighborhood Neighbor");
    expect(profile.pointsToNextTier).toBe(50);
    expect(profile.earnedBadges.length).toBe(0);
  });

  it("advances user to Level 2 (Dhaka Scout) when reaching 50 points", () => {
    const profile = computeGamification({
      points: 85,
      reportsCount: 2,
      verificationsCount: 4,
      categoriesReported: ["waterlogging"],
    });

    expect(profile.currentTier.level).toBe(2);
    expect(profile.currentTier.titleEn).toBe("Dhaka Scout");
    expect(profile.currentTier.titleBn).toBe("ঢাকা স্কাউট");
    expect(profile.earnedBadges.map((b) => b.id)).toContain("first_alert");
    expect(profile.earnedBadges.map((b) => b.id)).toContain("flood_scout");
    expect(profile.earnedBadges.map((b) => b.id)).toContain("truth_sentinel");
  });

  it("computes correct progress percentage towards next tier", () => {
    const tier = getTierForPoints(200);
    expect(tier.level).toBe(3); // Civic Guardian (150 - 349)

    const profile = computeGamification({
      points: 200,
      reportsCount: 5,
      verificationsCount: 10,
    });

    expect(profile.currentTier.level).toBe(3);
    expect(profile.pointsToNextTier).toBe(150); // 350 - 200 = 150
    expect(profile.progressPercent).toBe(25); // (200 - 150) / (350 - 150) = 50 / 200 = 25%
  });
});
