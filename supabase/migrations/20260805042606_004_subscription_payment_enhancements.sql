/*
# Subscription & Payment enhancements

1. Add razorpay_order_id, razorpay_payment_id, billing_cycle to payments
   so we can store the Razorpay order + payment references for verification.
2. Add razorpay_payment_id to subscriptions for audit.
3. Allow users to read their own payments (billing history).
*/

ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id text DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id text DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id text DEFAULT '';

-- Allow users to read their own payment history
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Allow users to insert their own payment records (after successful checkout)
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
