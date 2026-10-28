import { describe, it, expect } from "vitest";
import { sanitizeInput } from "@/lib/sanitize";

describe("Content Sanitization & XSS Protection", () => {
  it("strips script tags and malicious HTML", () => {
    const dirty = "Waterlogging <script>alert('xss')</script> near road";
    expect(sanitizeInput(dirty)).toBe("Waterlogging alert('xss') near road");
  });

  it("strips javascript: and on-handler attributes", () => {
    const dirty = `<img src=x onerror="alert(1)"> Broken road`;
    expect(sanitizeInput(dirty)).toBe("Broken road");
  });
});
