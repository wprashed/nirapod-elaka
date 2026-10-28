import { describe, it, expect } from "vitest";
import { dataStore } from "@/lib/data-store";

describe("Nirapod Data Store & Lifecycle Engine", () => {
  it("initializes with realistic Dhaka demonstration reports", () => {
    const res = dataStore.getReports({ limit: 10 });
    expect(res.reports.length).toBeGreaterThanOrEqual(5);
    expect(res.reports[0].isDemo).toBe(true);
  });

  it("creates a new hazard report and retrieves it by ID", () => {
    const created = dataStore.createReport({
      title: "Broken water supply line flooded Kazipara lane",
      description: "WASA water pipe burst creating mud and traffic jam.",
      category: "utility_disruption",
      latitude: 23.798,
      longitude: 90.374,
      publicLocationDesc: "Kazipara Central Road",
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("submitted");
    expect(created.confirmCount).toBe(1);

    const fetched = dataStore.getReportById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe(created.title);
  });

  it("detects geographic and textual duplicate candidates", () => {
    // We already have "Waterlogging on Mirpur Road near Dhanmondi 27" at 23.7533, 90.3768
    const duplicates = dataStore.findDuplicateCandidates({
      latitude: 23.7534,
      longitude: 90.3769,
      category: "waterlogging",
      title: "Waterlogging at Dhanmondi 27 Mirpur road",
      radiusKm: 0.5,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].category).toBe("waterlogging");
    expect(duplicates[0].distanceKm).toBeLessThan(0.2);
  });

  it("advances status to community_confirmed when reaching 3 confirms", () => {
    const rep = dataStore.createReport({
      title: "Temporary test hazard for confirmation",
      description: "Testing lifecycle transitions.",
      category: "other",
      latitude: 23.81,
      longitude: 90.41,
    });

    expect(rep.status).toBe("submitted");

    // Add 2 more confirms (starts at 1)
    dataStore.addVerification({ reportId: rep.id, result: "confirm" });
    const finalConfirm = dataStore.addVerification({ reportId: rep.id, result: "confirm" });

    expect(finalConfirm?.report.confirmCount).toBe(3);
    expect(finalConfirm?.report.status).toBe("community_confirmed");
  });

  it("adds community updates and links them to the report", () => {
    const rep = dataStore.createReport({
      title: "Test report for updates",
      description: "Testing updates thread.",
      category: "traffic_disruption",
      latitude: 23.78,
      longitude: 90.4,
    });

    const update = dataStore.addUpdate({
      reportId: rep.id,
      updateType: "status_update",
      description: "Police arrived and cleared one lane.",
    });

    expect(update).not.toBeNull();
    expect(update?.reportId).toBe(rep.id);

    const fetched = dataStore.getReportById(rep.id);
    expect(fetched?.updates.length).toBeGreaterThanOrEqual(1);
    expect(fetched?.updates[0].description).toBe("Police arrived and cleared one lane.");
  });

  it("enforces moderation logging when an officer changes report status", () => {
    const rep = dataStore.createReport({
      title: "Test report for moderation",
      description: "Testing audit trail.",
      category: "damaged_road",
      latitude: 23.76,
      longitude: 90.39,
    });

    const res = dataStore.moderateReport({
      reportId: rep.id,
      action: "resolve",
      reason: "Confirmed via DNCC ward maintenance report.",
      moderatorId: "mod-test-officer",
    });

    expect(res?.report.status).toBe("resolved");
    expect(res?.log.action).toBe("resolve");
    expect(res?.log.reason).toBe("Confirmed via DNCC ward maintenance report.");

    const logs = dataStore.getModerationLogs();
    expect(logs[0].reportId).toBe(rep.id);
  });
});
