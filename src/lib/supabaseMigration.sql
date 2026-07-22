-- Run this in Supabase SQL Editor to add new columns to the emergencies table.

ALTER TABLE emergencies
  ADD COLUMN IF NOT EXISTS symptoms text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS snake_type text,
  ADD COLUMN IF NOT EXISTS risk_level text,
  ADD COLUMN IF NOT EXISTS confidence float;
