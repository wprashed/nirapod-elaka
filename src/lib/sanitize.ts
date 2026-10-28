/**
 * Basic HTML sanitization for user-submitted text.
 * Strips all HTML tags and trims whitespace.
 * For rich text, use a proper allowlist library.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}
