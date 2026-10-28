/**
 * Environment configuration validator (Audit Item 34)
 */

export interface AppEnv {
  nodeEnv: string;
  isProduction: boolean;
  jwtSecret: string;
  cronSecret?: string;
  databaseUrl?: string;
}

export function getValidatedEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  const jwtSecret = process.env.JWT_SECRET || (isProduction ? "" : "dev-only-insecure-secret-key-at-least-32-chars-long");
  if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error(
      "FATAL: In production, JWT_SECRET must be explicitly set to a cryptographically secure random string with at least 32 characters."
    );
  }

  return {
    nodeEnv,
    isProduction,
    jwtSecret,
    cronSecret: process.env.CRON_SECRET,
    databaseUrl: process.env.DATABASE_URL,
  };
}

export const env = getValidatedEnv();
