-- NirapodElaka — initial PostGIS migration
-- Run after Drizzle creates the base tables.

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for text similarity search

-- Add a geography column for precise geospatial queries
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Populate from lat/lng on existing rows
UPDATE reports
  SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- GIST index on geography column
CREATE INDEX IF NOT EXISTS reports_location_gist_idx
  ON reports USING GIST (location);

-- Trigram index for text similarity (duplicate detection)
CREATE INDEX IF NOT EXISTS reports_title_trgm_idx
  ON reports USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS reports_description_trgm_idx
  ON reports USING GIN (description gin_trgm_ops);

-- Trigger to keep geography in sync with lat/lng
CREATE OR REPLACE FUNCTION sync_report_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_report_location_trigger ON reports;
CREATE TRIGGER sync_report_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON reports
  FOR EACH ROW EXECUTE FUNCTION sync_report_location();
