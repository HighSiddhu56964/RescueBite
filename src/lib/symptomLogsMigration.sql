-- ═══════════════════════════════════════════════
-- FIX: symptom_logs.user_id type mismatch
-- The users table uses uuid, but symptom_logs
-- has user_id as bigint → inserts ALWAYS fail
--
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- Drop the old table (it has no data since inserts always failed)
DROP TABLE IF EXISTS symptom_logs;

-- Recreate with correct uuid type
CREATE TABLE symptom_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  result text DEFAULT '',
  severity text DEFAULT 'LOW',
  risk_level text DEFAULT 'LOW',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user ON symptom_logs (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE symptom_logs;
