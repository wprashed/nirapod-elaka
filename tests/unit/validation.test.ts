import { describe, it, expect } from "vitest";
import { createReportSchema, verificationSchema, createUpdateSchema, abuseReportSchema } from "@/lib/validation";

describe("Input Validation & Civic Guardrails", () => {
  it("validates a compliant hazard report", () => {
    const valid = {
      title: "Waterlogging at Dhanmondi 27",
      description: "Water level is approximately 2 feet deep near the intersection.",
      category: "waterlogging",
      latitude: 23.7533,
      longitude: 90.3768,
      publicLocationDesc: "Mirpur Road, Dhanmondi 27",
    };

    const res = createReportSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects short or empty titles", () => {
    const invalid = {
      title: "Bad",
      description: "Valid long description about road hazard.",
      category: "blocked_road",
      latitude: 23.8,
      longitude: 90.4,
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects invalid categories outside permitted civic taxonomy", () => {
    const invalid = {
      title: "Political rally or strike",
      description: "Non-hazard description that should fail schema validation.",
      category: "invalid_category",
      latitude: 23.8,
      longitude: 90.4,
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects coordinates outside valid geospatial bounds", () => {
    const invalid = {
      title: "Valid title here",
      description: "Valid description here for hazard.",
      category: "fallen_tree",
      latitude: 105.0, // Invalid latitude > 90
      longitude: 90.4,
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates community verification actions", () => {
    const validConfirm = {
      reportId: "123e4567-e89b-12d3-a456-426614174000",
      result: "confirm",
    };
    expect(verificationSchema.safeParse(validConfirm).success).toBe(true);

    const validDispute = {
      reportId: "123e4567-e89b-12d3-a456-426614174000",
      result: "dispute",
    };
    expect(verificationSchema.safeParse(validDispute).success).toBe(true);
  });

  it("validates community updates format", () => {
    const update = {
      reportId: "123e4567-e89b-12d3-a456-426614174000",
      updateType: "severity_change",
      description: "Water has drained completely.",
    };
    expect(createUpdateSchema.safeParse(update).success).toBe(true);
  });
});
