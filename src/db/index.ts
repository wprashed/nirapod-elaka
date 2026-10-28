import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prevent multiple connections in development (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

let client: postgres.Sql;

if (process.env.NODE_ENV === "production") {
  client = postgres(connectionString, { max: 10 });
} else {
  if (!global._pgClient) {
    global._pgClient = postgres(connectionString, { max: 5 });
  }
  client = global._pgClient;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
