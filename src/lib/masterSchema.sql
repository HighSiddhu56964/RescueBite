-- ==============================================================================
-- 🚨 MASTER SCHEMA REBUILD SCRIPT 🚨
-- This script will DANGEROUSLY DROP all existing tables and recreate them.
-- ALL DATA WILL BE DELETED.
-- Run this in your Supabase SQL Editor to get a perfectly clean state.
-- ==============================================================================

-- 1. DROP ALL EXISTING TABLES (in correct dependency order if any existed)
DROP TABLE IF EXISTS symptom_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS emergencies;
DROP TABLE IF EXISTS authorities;
DROP TABLE IF EXISTS users;

-- 2. RECREATE ALL TABLES WITH UUIDs

-- --------------------------------------------------------
-- Table: users (Citizen Accounts)
-- --------------------------------------------------------
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  age integer,
  gender text,
  phone text UNIQUE,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------
-- Table: authorities (Authority/Hospital Accounts)
-- --------------------------------------------------------
CREATE TABLE authorities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name text NOT NULL,
  gr_number text UNIQUE NOT NULL,
  password text NOT NULL,
  antivenom_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------
-- Table: emergencies (SOS Alerts)
-- --------------------------------------------------------
CREATE TABLE emergencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_phone text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  message text DEFAULT 'Snakebite Emergency',
  symptoms text DEFAULT '',
  severity text DEFAULT 'LOW',
  risk_level text DEFAULT 'LOW',
  assigned_facility text DEFAULT 'Unknown',
  status text DEFAULT 'pending', -- pending, resolved
  created_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------
-- Table: reports (AI Detection Logs for Heatmap)
-- --------------------------------------------------------
CREATE TABLE reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  detected boolean NOT NULL DEFAULT false,
  snake_type text,
  confidence double precision,
  risk_level text DEFAULT 'NONE',
  image_url text,
  latitude double precision,
  longitude double precision,
  location_name text DEFAULT '',
  source text DEFAULT 'detection', -- 'detection' or 'sos'
  symptoms text DEFAULT '',
  severity text DEFAULT 'LOW',
  created_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------
-- Table: symptom_logs (AI Chat History)
-- --------------------------------------------------------
CREATE TABLE symptom_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  result text DEFAULT '',
  severity text DEFAULT 'LOW',
  risk_level text DEFAULT 'LOW',
  created_at timestamptz DEFAULT now()
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX idx_emergencies_location ON emergencies (latitude, longitude);
CREATE INDEX idx_reports_location ON reports (latitude, longitude);
CREATE INDEX idx_emergencies_user ON emergencies (user_id);
CREATE INDEX idx_reports_user ON reports (user_id);
CREATE INDEX idx_symptom_logs_user ON symptom_logs (user_id);

-- 4. ENABLE REALTIME FOR DASHBOARD & HEATMAP
-- This ensures the Authority Dashboard and map update instantly.
ALTER PUBLICATION supabase_realtime ADD TABLE emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
