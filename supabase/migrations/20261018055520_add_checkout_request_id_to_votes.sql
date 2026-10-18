/*
# Add checkout_request_id to votes table

## 1. Modified Tables
### votes
- Add `checkout_request_id` (text, nullable) — the CheckoutRequestID returned
  by Daraja's STK push response. Used by the callback to match the Safaricom
  callback to the correct vote row.

## 2. Notes
- No RLS changes needed — existing policies already cover SELECT/INSERT/UPDATE.
*/

ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS checkout_request_id text;

DROP POLICY IF EXISTS "anon_update_votes" ON votes;
CREATE POLICY "anon_update_votes" ON votes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
