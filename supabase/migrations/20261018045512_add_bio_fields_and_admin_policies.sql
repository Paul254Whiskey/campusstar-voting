/*
# Add bio fields to contestants + registrations + admin delete

## 1. Add bio columns to contestants and registrations
- bio (text) — short personal description
- hobbies (text) — hobbies/interests
- fun_facts (text) — fun facts / funfairs
- place_of_study (text) — where they study (campus location)

## 2. Add DELETE policy on contestants and registrations for admin management
## 3. Add DELETE policy on votes for admin reset
*/

ALTER TABLE contestants
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hobbies text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fun_facts text DEFAULT '',
  ADD COLUMN IF NOT EXISTS place_of_study text DEFAULT '';

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hobbies text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fun_facts text DEFAULT '',
  ADD COLUMN IF NOT EXISTS place_of_study text DEFAULT '';

-- Allow admin to delete contestants (remove from competition)
DROP POLICY IF EXISTS "anon_delete_contestants" ON contestants;
CREATE POLICY "anon_delete_contestants" ON contestants FOR DELETE
  TO anon, authenticated USING (true);

-- Allow admin to update registrations (approve/reject)
DROP POLICY IF EXISTS "anon_update_registrations" ON registrations;
CREATE POLICY "anon_update_registrations" ON registrations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow admin to delete registrations
DROP POLICY IF EXISTS "anon_delete_registrations" ON registrations;
CREATE POLICY "anon_delete_registrations" ON registrations FOR DELETE
  TO anon, authenticated USING (true);

-- Allow admin to delete votes (for reset)
DROP POLICY IF EXISTS "anon_delete_votes" ON votes;
CREATE POLICY "anon_delete_votes" ON votes FOR DELETE
  TO anon, authenticated USING (true);

-- Allow admin to delete comments (for reset)
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);
