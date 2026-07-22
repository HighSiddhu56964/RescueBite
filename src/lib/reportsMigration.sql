-- ═══════════════════════════════════════════════
-- Reports Table — stores detection & SOS results
-- Your existing table is already correct (uuid types)
-- This is a REFERENCE — only run if table doesn't exist
-- ═══════════════════════════════════════════════

-- NOTE: Your reports table already exists with correct uuid columns.
-- DO NOT run this if the table is already there.

CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  detected boolean NOT NULL DEFAULT false,
  snake_type text,
  confidence double precision,
  risk_level text DEFAULT 'NONE',
  image_url text,
  latitude double precision,
  longitude double precision,
  location_name text DEFAULT '',
  source text DEFAULT 'detection',
  symptoms text DEFAULT '',
  severity text DEFAULT 'LOW',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_location ON reports (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE reports;
