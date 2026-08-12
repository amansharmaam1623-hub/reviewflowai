/*
# Dashboard Realtime & Review Tracking Enhancements

1. Add review_source, business_response, response_at columns to reviews table
   so we can track traffic sources and business responses.
2. Allow anon to INSERT reviews (public review flow — customers not logged in).
3. Create increment_qr_scan() SECURITY DEFINER RPC to atomically increment
   QR scan count + last_scan timestamp (callable by anon for public QR flow).
4. Enable realtime publication for reviews and qr_codes tables.
5. Add index on reviews.created_at for monthly aggregation performance.
*/

-- ============================================================
-- 1. Reviews table enhancements
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_source text DEFAULT 'direct';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_response text DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_at timestamptz DEFAULT NULL;

-- Allow anon to INSERT reviews (public review flow — customers not logged in)
DROP POLICY IF EXISTS "reviews_insert_anon" ON reviews;
CREATE POLICY "reviews_insert_anon" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Index for monthly aggregation
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_business_created ON reviews(business_id, created_at);

-- ============================================================
-- 2. increment_qr_scan() RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_qr_scan(qr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.qr_codes
  SET scans = scans + 1,
      last_scan = now(),
      updated_at = now()
  WHERE id = qr_id;
END;
$$;

-- Revoke all, then grant execute to anon + authenticated
REVOKE ALL ON FUNCTION public.increment_qr_scan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan(uuid) TO anon, authenticated;

-- ============================================================
-- 3. Realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE qr_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
