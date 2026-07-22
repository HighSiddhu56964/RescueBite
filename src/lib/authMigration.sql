-- Run this in Supabase SQL Editor to create auth tables.

-- Users table (for normal users)
CREATE TABLE IF NOT EXISTS users (
  id bigint generated always as identity primary key,
  name text NOT NULL,
  age integer,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Authorities table (for emergency responders)
CREATE TABLE IF NOT EXISTS authorities (
  id bigint generated always as identity primary key,
  gr_number text UNIQUE NOT NULL,
  password text NOT NULL,
  name text DEFAULT '',
  antivenom_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow all for now (basic security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/insert for users table
CREATE POLICY "Allow anonymous access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anonymous read for authorities table
CREATE POLICY "Allow anonymous access to authorities" ON authorities
  FOR ALL USING (true) WITH CHECK (true);
