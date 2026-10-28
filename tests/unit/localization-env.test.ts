import { describe, it, expect } from "vitest";
import { toBengaliNumerals, formatTimestamp } from "@/lib/constants";
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
});

describe("Environment Validation (Audit Item 34)", () => {
  it("returns validated env configuration in test environment", () => {
    const env = getValidatedEnv();
    expect(env.nodeEnv).toBeDefined();
    expect(env.jwtSecret).toBeDefined();
  });
});
