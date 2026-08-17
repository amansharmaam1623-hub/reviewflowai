/*
# Feedback Inbox — Internal Feedback Table for Low Ratings

## Purpose
When a customer selects 1-3 stars, their feedback is saved internally
instead of being redirected to Google. This table stores that private
feedback so business owners can review and resolve it.

## New Table: feedback
- `id` (uuid, primary key)
- `business_id` (uuid, FK to businesses, ON DELETE CASCADE)
- `rating` (integer, 1-5, required)
- `generated_review` (text, the AI-generated review text)
- `customer_name` (text, optional — anonymous if not provided)
- `customer_email` (text, optional)
- `sentiment` (text, defaults to 'negative')
- `review_source` (text, defaults to 'internal_feedback')
- `status` (text, 'pending' or 'resolved', defaults to 'pending')
- `created_at` (timestamptz, defaults to now())

## Security (RLS)
- SELECT: business owners can read feedback for their own businesses; admins can read all.
- INSERT: anon + authenticated can insert (customers submitting feedback are not logged in).
- UPDATE: business owners can update status for their own feedback; admins can update all.
- DELETE: business owners can delete feedback for their own businesses.

## Notes
1. The INSERT policy allows anon because the review flow is a public-facing
   page accessed via QR code — the customer is NOT logged in.
2. The UPDATE policy allows owners to change status from 'pending' to 'resolved'.
3. Index on business_id for efficient lookups.
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  generated_review text DEFAULT '',
  customer_name text DEFAULT '',
  customer_email text DEFAULT '',
  sentiment text NOT NULL DEFAULT 'negative',
  review_source text NOT NULL DEFAULT 'internal_feedback',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- SELECT: owners can read their own feedback, admins can read all
DROP POLICY IF EXISTS "feedback_select_own" ON feedback;
CREATE POLICY "feedback_select_own" ON feedback FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- INSERT: anon + authenticated (public review flow, customer not logged in)
DROP POLICY IF EXISTS "feedback_insert_anon" ON feedback;
CREATE POLICY "feedback_insert_anon" ON feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- UPDATE: owners can update status for their own feedback, admins can update all
DROP POLICY IF EXISTS "feedback_update_own" ON feedback;
CREATE POLICY "feedback_update_own" ON feedback FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- DELETE: owners can delete their own feedback
DROP POLICY IF EXISTS "feedback_delete_own" ON feedback;
CREATE POLICY "feedback_delete_own" ON feedback FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
