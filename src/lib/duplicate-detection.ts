import { db } from "@/db";
import { reports } from "@/db/schema";
import { and, eq, ne, sql, lt } from "drizzle-orm";
import type { ReportCategory } from "./validation";

export interface DuplicateCandidate {
  id: string;
  title: string;
  category: string;
  publicLocationDesc: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  status: string;
  distanceKm: number;
  titleSimilarity: number;
}

/**
 * Find potential duplicate reports based on:
 * 1. Geographic proximity (within radiusKm)
 * 2. Same category
 * 3. Submitted within the time window
 * 4. Text similarity (pg_trgm)
 *
 * Returns ranked candidates (most likely duplicates first).
 */
export async function findDuplicateCandidates(params: {
  latitude: number;
  longitude: number;
  category: ReportCategory;
  title: string;
  excludeId?: string;
  radiusKm?: number;
  withinHours?: number;
}): Promise<DuplicateCandidate[]> {
  const {
    latitude,
    longitude,
    category,
    title,
    excludeId,
    radiusKm = 0.5,
    withinHours = 24,
  } = params;

  // We use PostGIS ST_DWithin for proximity and pg_trgm similarity for text
  const rows = await db.execute(sql`
    SELECT
      r.id,
      r.title,
      r.category,
      r.public_location_desc,
      r.latitude,
      r.longitude,
      r.created_at,
      r.status,
      ST_Distance(
        r.location,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) / 1000.0 AS distance_km,
      similarity(r.title, ${title}) AS title_similarity
    FROM reports r
    WHERE
      r.category = ${category}
      AND r.status NOT IN ('resolved', 'archived')
      AND r.created_at > NOW() - INTERVAL '${sql.raw(withinHours.toString())} hours'
      AND ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusKm * 1000}
      )
      ${excludeId ? sql`AND r.id != ${excludeId}` : sql``}
    ORDER BY
      distance_km ASC,
      title_similarity DESC
    LIMIT 5
  `);

  return (rows as any[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    publicLocationDesc: row.public_location_desc,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    createdAt: new Date(row.created_at),
    status: row.status,
    distanceKm: parseFloat(row.distance_km),
    titleSimilarity: parseFloat(row.title_similarity),
  }));
}

/**
 * Score a candidate: returns 0–1 where 1 = very likely duplicate.
 */
export function scoreDuplicate(candidate: DuplicateCandidate): number {
  const distanceScore = Math.max(0, 1 - candidate.distanceKm / 0.5);
  const textScore = candidate.titleSimilarity;
  return distanceScore * 0.6 + textScore * 0.4;
}
