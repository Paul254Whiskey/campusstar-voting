/*
# Create mpesa_payments table (mock/test mode)

## 1. New Table
### mpesa_payments
Records each M-Pesa vote payment. In test/mock mode, rows are written directly
from the frontend via the mpesa-stk edge function with status='completed'.
- id (uuid, pk)
- contestant_id (uuid, fk -> contestants)
- phone (text) — voter's M-Pesa phone
- amount_kes (int) — amount paid
- vote_count (int) — votes credited
- status (text, default 'completed') — pending | completed | failed
- mpesa_code (text) — transaction code (mock in test mode)
- created_at (timestamptz)

## 2. Security
- RLS enabled.
- Public read (for transparency / admin analytics).
- Public insert (edge function writes completed mock payments).
- Public delete (admin season reset).
*/

CREATE TABLE IF NOT EXISTS mpesa_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contestant_id uuid REFERENCES contestants(id) ON DELETE CASCADE,
  phone text NOT NULL DEFAULT '',
  amount_kes int NOT NULL DEFAULT 0,
  vote_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  mpesa_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mpesa_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mpesa_payments" ON mpesa_payments;
CREATE POLICY "anon_select_mpesa_payments" ON mpesa_payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_mpesa_payments" ON mpesa_payments;
CREATE POLICY "anon_insert_mpesa_payments" ON mpesa_payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_mpesa_payments" ON mpesa_payments;
CREATE POLICY "anon_delete_mpesa_payments" ON mpesa_payments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mpesa_payments_contestant ON mpesa_payments(contestant_id);
