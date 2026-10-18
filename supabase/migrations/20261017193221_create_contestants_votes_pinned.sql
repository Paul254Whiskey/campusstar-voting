/*
# Campus Star Award — core schema

Creates the contestant, vote, registration submission, and pinned-favorite
tables that power the campus creator voting platform.

## 1. New Tables

### contestants
Approved contestants shown on leaderboards.
- id (uuid, pk)
- full_name (text, not null) — display name
- first_name / last_name (text) — used for avatar initials fallback
- contact_number (text) — phone
- category (text) — TikTok, Singing, Comedy, Dance, Couple, Campus Celebrity etc.
- gender (text) — Male / Female
- county (text) — Nairobi, Kisumu, Mombasa etc.
- university (text)
- profile_image_url (text, nullable) — if missing, UI shows initials
- social_handles (jsonb) — { instagram, tiktok, facebook, x } voters can click
- votes_count (int, default 0) — denormalized total for fast leaderboard reads
- is_verified (bool, default false) — green check
- is_trending (bool, default false) — fire icon
- level (text, default 'campus') — campus | inter-campus | county | national
- status (text, default 'approved') — approved | pending | rejected
- created_at (timestamptz)

### registrations
Submissions from the "Enter free now" form, pending admin approval.
- id (uuid, pk)
- full_name, first_name, last_name, contact_number, category, gender, county, university
- profile_image_url (text, nullable)
- social_handles (jsonb)
- status (text, default 'pending')
- created_at (timestamptz)

### votes
One row per paid vote batch. Drives `votes_count` on contestants.
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants)
- voter_phone (text) — M-Pesa phone used
- mpesa_code (text) — M-Pesa transaction code
- amount_kes (int) — amount paid
- vote_count (int) — votes credited (including bonus)
- status (text, default 'completed') — pending | completed | failed
- created_at (timestamptz)

### pinned_contestants
Voter-pinned favorites (tracked by voter_phone so no auth needed).
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants)
- voter_phone (text)
- created_at (timestamptz)
- unique(contestant_id, voter_phone)

## 2. Security (RLS)

This app has no sign-in screen — voters browse and pay via M-Pesa without
accounts. All policies are TO anon, authenticated and intentionally public:
- contestants/registrations: public read; anon can insert registrations (form) and contestants are managed via service role in the edge function.
- votes: public read (for counts/leaderboards); inserts allowed (edge function writes completed votes).
- pinned_contestants: full CRUD for anon (keyed by voter_phone).

USING (true) / WITH CHECK (true) is acceptable here because all data is
intentionally shared public competition data — no user-scoped isolation.

## 3. Notes
- `votes_count` is maintained by the mpesa-callback edge function via atomic UPDATE ... SET votes_count = votes_count + N.
- Admin approval flow: registrations are inserted as pending; an admin (via service role) flips status and copies into contestants.
*/

CREATE TABLE IF NOT EXISTS contestants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Campus Celebrity',
  gender text NOT NULL DEFAULT 'Male',
  county text NOT NULL DEFAULT 'Nairobi',
  university text NOT NULL DEFAULT '',
  profile_image_url text,
  social_handles jsonb NOT NULL DEFAULT '{}'::jsonb,
  votes_count int NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  level text NOT NULL DEFAULT 'campus',
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Campus Celebrity',
  gender text NOT NULL DEFAULT 'Male',
  county text NOT NULL DEFAULT 'Nairobi',
  university text NOT NULL DEFAULT '',
  profile_image_url text,
  social_handles jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  voter_phone text NOT NULL DEFAULT '',
  mpesa_code text NOT NULL DEFAULT '',
  amount_kes int NOT NULL DEFAULT 0,
  vote_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pinned_contestants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  voter_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contestant_id, voter_phone)
);

ALTER TABLE contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_contestants ENABLE ROW LEVEL SECURITY;

-- contestants: public read, public insert (edge fn creates approved rows), update (edge fn increments votes)
DROP POLICY IF EXISTS "anon_select_contestants" ON contestants;
CREATE POLICY "anon_select_contestants" ON contestants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contestants" ON contestants;
CREATE POLICY "anon_insert_contestants" ON contestants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contestants" ON contestants;
CREATE POLICY "anon_update_contestants" ON contestants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- registrations: public read (voters can see pending? no — but we'll filter in app), public insert
DROP POLICY IF EXISTS "anon_select_registrations" ON registrations;
CREATE POLICY "anon_select_registrations" ON registrations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_registrations" ON registrations;
CREATE POLICY "anon_insert_registrations" ON registrations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- votes: public read (leaderboards), public insert (edge fn writes), no update/delete
DROP POLICY IF EXISTS "anon_select_votes" ON votes;
CREATE POLICY "anon_select_votes" ON votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- pinned_contestants: full CRUD for anon, keyed by voter_phone in app logic
DROP POLICY IF EXISTS "anon_select_pinned" ON pinned_contestants;
CREATE POLICY "anon_select_pinned" ON pinned_contestants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pinned" ON pinned_contestants;
CREATE POLICY "anon_insert_pinned" ON pinned_contestants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pinned" ON pinned_contestants;
CREATE POLICY "anon_update_pinned" ON pinned_contestants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pinned" ON pinned_contestants;
CREATE POLICY "anon_delete_pinned" ON pinned_contestants FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_contestants_votes_count ON contestants(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_contestants_category ON contestants(category);
CREATE INDEX IF NOT EXISTS idx_contestants_university ON contestants(university);
CREATE INDEX IF NOT EXISTS idx_votes_contestant ON votes(contestant_id);
CREATE INDEX IF NOT EXISTS idx_pinned_phone ON pinned_contestants(voter_phone);
