import { describe, it, expect } from "vitest";
import { NEWSPAPER_HAZARD_REPORTS } from "@/lib/newspaper-data";

describe("Bangladeshi Newspaper Hazard Dataset", () => {
  it("contains at least 30 authentic reported incidents across multiple categories", () => {
    expect(NEWSPAPER_HAZARD_REPORTS.length).toBeGreaterThanOrEqual(30);
    const categories = new Set(NEWSPAPER_HAZARD_REPORTS.map((r) => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(7);
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

  it("ensures all 32 reports contain complete, strict bilingual content", () => {
    const bengaliRegex = /[\u0980-\u09FF]/;

    NEWSPAPER_HAZARD_REPORTS.forEach((report, index) => {
      // Bengali fields must exist and contain Bengali characters
      expect(report.titleBn, `Report #${index + 1} missing titleBn`).toBeDefined();
      expect(report.descriptionBn, `Report #${index + 1} missing descriptionBn`).toBeDefined();
      expect(bengaliRegex.test(report.titleBn!), `Report #${index + 1} titleBn lacks Bengali characters`).toBe(true);
      expect(bengaliRegex.test(report.descriptionBn!), `Report #${index + 1} descriptionBn lacks Bengali characters`).toBe(true);

      // English fields must exist and MUST NOT contain any Bengali characters or numerals
      expect(report.titleEn, `Report #${index + 1} missing titleEn`).toBeDefined();
      expect(report.descriptionEn, `Report #${index + 1} missing descriptionEn`).toBeDefined();
      expect(report.titleEn!.length, `Report #${index + 1} titleEn is too short`).toBeGreaterThan(10);
      expect(report.descriptionEn!.length, `Report #${index + 1} descriptionEn is too short`).toBeGreaterThan(20);
      expect(bengaliRegex.test(report.titleEn!), `Report #${index + 1} titleEn contains illegal Bengali characters: ${report.titleEn}`).toBe(false);
      expect(bengaliRegex.test(report.descriptionEn!), `Report #${index + 1} descriptionEn contains illegal Bengali characters: ${report.descriptionEn}`).toBe(false);

      // Locations and landmarks must also be bilingually populated
      expect(report.publicLocationDescBn).toBeDefined();
      expect(report.publicLocationDescEn).toBeDefined();
      expect(bengaliRegex.test(report.publicLocationDescEn!)).toBe(false);

      expect(report.nearbyLandmarkBn).toBeDefined();
      expect(report.nearbyLandmarkEn).toBeDefined();
      expect(bengaliRegex.test(report.nearbyLandmarkEn!)).toBe(false);
    });
  });
});
