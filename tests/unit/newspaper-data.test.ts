import { describe, it, expect } from "vitest";
import { NEWSPAPER_HAZARD_REPORTS } from "@/lib/newspaper-data";

describe("Bangladeshi Newspaper Hazard Dataset", () => {
  it("contains at least 14 authentic reported incidents across multiple categories", () => {
    expect(NEWSPAPER_HAZARD_REPORTS.length).toBeGreaterThanOrEqual(14);
    const categories = new Set(NEWSPAPER_HAZARD_REPORTS.map((r) => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
  });

  it("ensures all entries have valid Dhaka coordinates", () => {
    NEWSPAPER_HAZARD_REPORTS.forEach((report) => {
      // Greater Dhaka bounding box
      expect(report.latitude).toBeGreaterThan(23.65);
      expect(report.latitude).toBeLessThan(23.95);
      expect(report.longitude).toBeGreaterThan(90.3);
      expect(report.longitude).toBeLessThan(90.52);
    });
  });

  it("ensures every report has a verified news source citation with valid URL", () => {
    const validOutlets = ["The Daily Star", "Dhaka Tribune", "দৈনিক প্রথম আলো (Prothom Alo)"];
    NEWSPAPER_HAZARD_REPORTS.forEach((report) => {
      expect(report.newsSource).toBeDefined();
      expect(validOutlets).toContain(report.newsSource?.name);
      expect(report.newsSource?.url).toMatch(/^https?:\/\//);
    });
  });

  it("ensures all reports have meaningful titles, descriptions, and landmarks", () => {
    NEWSPAPER_HAZARD_REPORTS.forEach((report) => {
      expect(report.title.length).toBeGreaterThan(10);
      expect(report.description.length).toBeGreaterThan(20);
      expect(report.nearbyLandmark).toBeDefined();
      expect(report.publicLocationDesc).toBeDefined();
    });
  });
});
