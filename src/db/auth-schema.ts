import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// This file is intentionally minimal — it re-exports NextAuth adapter-compatible
// table definitions from schema.ts via the adapter. See src/lib/auth.ts.
export * from "./schema";
