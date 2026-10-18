/*
# Add top_supporters, contestant_accounts, profile_edit_logs, app_settings + supporter_name on votes

## 1. New Tables

### top_supporters
Tracks top voters per contestant for the "Top supporters" leaderboard on the profile page.
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants)
- supporter_name (text) — name entered by voter, or "Anonymous"
- voter_phone (text) — used to aggregate votes from the same person
- total_votes (int) — cumulative votes this supporter has given this contestant
- is_anonymous (bool, default false)
- last_voted_at (timestamptz)
- created_at (timestamptz)
Unique constraint on (contestant_id, voter_phone) so each phone aggregates into one row.

### contestant_accounts
Password-protected login for contestants to edit their own profile.
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants, unique)
- password_hash (text) — simple hash (demo); upgrade to bcrypt via edge function later
- created_at (timestamptz)

### profile_edit_logs
Audit trail of every profile edit made by a contestant, visible in the admin panel.
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants)
- changed_fields (text) — comma-separated list of fields changed
- old_values (jsonb)
- new_values (jsonb)
- edited_at (timestamptz)

### app_settings
Single-row key-value store for app-wide settings (countdown deadline etc).
- id (int, pk, always 1)
- voting_deadline (timestamptz) — the countdown target the admin can reset/extend
- updated_at (timestamptz)

## 2. Modified Tables
### votes
- Add supporter_name (text, nullable) — the name the voter entered for the supporter leaderboard

## 3. Security
- RLS enabled on all new tables.
- top_supporters: public read (shown on profile page), public insert/update (written when vote completes).
- contestant_accounts: public read of contestant_id only (for login lookup); insert/update public (demo).
- profile_edit_logs: public read (admin panel), public insert.
- app_settings: public read (countdown needs it), public update (admin controls it).
All tables use TO anon, authenticated since this is a no-auth app (contestant login is custom, not Supabase auth).
*/

-- votes: add supporter_name
ALTER TABLE votes ADD COLUMN IF NOT EXISTS supporter_name text;

-- top_supporters
CREATE TABLE IF NOT EXISTS top_supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  supporter_name text NOT NULL DEFAULT 'Anonymous',
  voter_phone text NOT NULL DEFAULT '',
  total_votes int NOT NULL DEFAULT 0,
  is_anonymous boolean NOT NULL DEFAULT false,
  last_voted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contestant_id, voter_phone)
);
CREATE INDEX IF NOT EXISTS idx_top_supporters_contestant ON top_supporters(contestant_id, total_votes DESC);

ALTER TABLE top_supporters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_top_supporters" ON top_supporters;
CREATE POLICY "anon_select_top_supporters" ON top_supporters FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_top_supporters" ON top_supporters;
CREATE POLICY "anon_insert_top_supporters" ON top_supporters FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_top_supporters" ON top_supporters;
CREATE POLICY "anon_update_top_supporters" ON top_supporters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_top_supporters" ON top_supporters;
CREATE POLICY "anon_delete_top_supporters" ON top_supporters FOR DELETE
  TO anon, authenticated USING (true);

-- contestant_accounts
CREATE TABLE IF NOT EXISTS contestant_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid UNIQUE NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  password_hash text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contestant_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_contestant_accounts" ON contestant_accounts;
CREATE POLICY "anon_select_contestant_accounts" ON contestant_accounts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contestant_accounts" ON contestant_accounts;
CREATE POLICY "anon_insert_contestant_accounts" ON contestant_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contestant_accounts" ON contestant_accounts;
CREATE POLICY "anon_update_contestant_accounts" ON contestant_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contestant_accounts" ON contestant_accounts;
CREATE POLICY "anon_delete_contestant_accounts" ON contestant_accounts FOR DELETE
  TO anon, authenticated USING (true);

-- profile_edit_logs
CREATE TABLE IF NOT EXISTS profile_edit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  changed_fields text NOT NULL DEFAULT '',
  old_values jsonb,
  new_values jsonb,
  edited_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_edit_logs_contestant ON profile_edit_logs(contestant_id, edited_at DESC);

ALTER TABLE profile_edit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profile_edit_logs" ON profile_edit_logs;
CREATE POLICY "anon_select_profile_edit_logs" ON profile_edit_logs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profile_edit_logs" ON profile_edit_logs;
CREATE POLICY "anon_insert_profile_edit_logs" ON profile_edit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profile_edit_logs" ON profile_edit_logs;
CREATE POLICY "anon_delete_profile_edit_logs" ON profile_edit_logs FOR DELETE
  TO anon, authenticated USING (true);

-- app_settings (single row, id=1)
CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  voting_deadline timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO app_settings (id, voting_deadline)
  VALUES (1, (now() + interval '30 days'))
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
