import { describe, it, expect } from "vitest";
import { toBengaliNumerals, formatTimestamp, getLocalizedReportText } from "@/lib/constants";
import { getValidatedEnv } from "@/lib/env";

describe("Localization and Formatting (Audit Items 27 & 28)", () => {
  it("converts ASCII numerals to Bengali digits correctly", () => {
    expect(toBengaliNumerals(0)).toBe("০");
    expect(toBengaliNumerals(1234567890)).toBe("১২৩৪৫৬৭৮৯০");
    expect(toBengaliNumerals("Road 27, Block C")).toBe("Road ২৭, Block C");
  });

  it("formats relative timestamps in Bengali locale", () => {
    const justNow = new Date();
    const resultNow = formatTimestamp(justNow, "bn");
    expect(resultNow.relative).toBe("এইমাত্র");
    expect(resultNow.absolute).toContain("বিএসটি");

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    const result2h = formatTimestamp(twoHoursAgo, "bn");
    expect(result2h.relative).toBe("২ ঘণ্টা আগে");
  });

  it("extracts localized report text strictly according to active locale", () => {
    const sample = {
      title: "বাংলা শিরোনাম",
      description: "বাংলা বিবরণ",
      publicLocationDesc: "মিরপুর",
      nearbyLandmark: "মেট্রো",
      titleBn: "বাংলা শিরোনাম",
      titleEn: "English Title",
      descriptionBn: "বাংলা বিবরণ",
      descriptionEn: "English Description",
      publicLocationDescBn: "মিরপুর ১০",
      publicLocationDescEn: "Mirpur 10",
      nearbyLandmarkBn: "মেট্রো স্টেশন",
      nearbyLandmarkEn: "Metro Station",
    };

    const bnResult = getLocalizedReportText(sample, "bn");
    expect(bnResult.title).toBe("বাংলা শিরোনাম");
    expect(bnResult.description).toBe("বাংলা বিবরণ");
    expect(bnResult.publicLocationDesc).toBe("মিরপুর ১০");
    expect(bnResult.nearbyLandmark).toBe("মেট্রো স্টেশন");

    const enResult = getLocalizedReportText(sample, "en");
    expect(enResult.title).toBe("English Title");
    expect(enResult.description).toBe("English Description");
    expect(enResult.publicLocationDesc).toBe("Mirpur 10");
    expect(enResult.nearbyLandmark).toBe("Metro Station");
    // Ensure English output has zero Bengali characters
    expect(/[\u0980-\u09FF]/.test(enResult.title)).toBe(false);
    expect(/[\u0980-\u09FF]/.test(enResult.description)).toBe(false);
  });
});

describe("Environment Validation (Audit Item 34)", () => {
  it("returns validated env configuration in test environment", () => {
    const env = getValidatedEnv();
    expect(env.nodeEnv).toBeDefined();
    expect(env.jwtSecret).toBeDefined();
  });
});
