/*
# Add comments table for contestant profiles

## 1. New Table

### comments
Voters can leave comments on contestant profiles. Public (no auth) — keyed by
voter name + phone for light identity.

- id (uuid, pk)
- contestant_id (uuid, fk -> contestants, cascade delete)
- voter_name (text) — display name the commenter chooses
- voter_phone (text) — optional, for spam control / identity
- body (text, not null) — the comment text
- created_at (timestamptz, default now())

## 2. Security
- RLS enabled, TO anon, authenticated (no-auth app).
- Public read (comments visible to all visitors).
- Public insert (anyone can post a comment).
- No update or delete (comments are immutable once posted).

## 3. Index
- idx_comments_contestant for fast lookup by contestant.
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
  voter_name text NOT NULL DEFAULT 'Anonymous',
  voter_phone text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_comments_contestant ON comments(contestant_id);
