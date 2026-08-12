/*
# Subscription System Enhancement — Trial Tracking, Payment Provider, Business Limits

## Overview
Enhances the subscriptions table to support a real 7-day trial system with
proper trial start/end timestamps, payment provider fields, cancellation,
and a server-side business limit enforcement RPC.

## Changes to `subscriptions` table
1. `trial_start` (timestamptz) — when the trial began
2. `trial_end` (timestamptz) — when the trial expires (trial_start + 7 days)
3. `current_period_start` (timestamptz) — start of the current billing cycle
4. `payment_provider` (text, default 'razorpay')
5. `customer_id` (text) — provider's customer ID
6. `provider_subscription_id` (text) — provider's subscription ID
7. `price_id` (text) — provider's price/plan ID
8. `cancel_at_period_end` (boolean, default false)

## Changes to `handle_new_user` trigger
Creates a subscription with plan=starter, status=trialing, 7-day trial.

## New RPCs
- `enforce_business_limit()` — checks if user can create a new business
- `get_subscription_status()` — returns calling user's subscription data

## RLS
- Subscriptions: allow users to UPDATE their own subscription.
*/

-- 1. Add new columns to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'razorpay';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS customer_id text DEFAULT '';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id text DEFAULT '';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_id text DEFAULT '';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

-- 2. Update status constraint BEFORE backfill
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancelled', 'expired', 'incomplete', 'trial'));

-- 3. Backfill existing rows
UPDATE subscriptions
SET status = 'trialing',
    trial_start = COALESCE(trial_start, created_at),
    trial_end = COALESCE(trial_end, created_at + interval '7 days'),
    current_period_start = COALESCE(current_period_start, created_at),
    current_period_end = COALESCE(current_period_end, created_at + interval '7 days')
WHERE status = 'trial';

-- 4. Update handle_new_user trigger for 7-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.subscriptions (
    user_id, plan, status, billing_cycle,
    trial_start, trial_end,
    current_period_start, current_period_end,
    payment_provider
  ) VALUES (
    NEW.id, 'starter', 'trialing', 'monthly',
    now(), now() + interval '7 days',
    now(), now() + interval '7 days',
    'razorpay'
  );

  RETURN NEW;
END;
$$;

-- 5. enforce_business_limit RPC
CREATE OR REPLACE FUNCTION public.enforce_business_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_status text;
  v_current_count integer;
  v_limit integer;
BEGIN
  SELECT plan, status INTO v_plan, v_status
  FROM public.subscriptions
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := 'starter';
  END IF;

  IF v_status IN ('cancelled', 'expired', 'payment_failed', 'incomplete') THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_current_count
  FROM public.businesses
  WHERE user_id = auth.uid();

  v_limit := CASE v_plan
    WHEN 'starter' THEN 1
    WHEN 'professional' THEN 3
    WHEN 'enterprise' THEN 1000000
    ELSE 1
  END;

  RETURN v_current_count < v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_business_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_business_limit() TO authenticated;

-- 6. get_subscription_status RPC
CREATE OR REPLACE FUNCTION public.get_subscription_status()
RETURNS TABLE (
  plan text,
  status text,
  billing_cycle text,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  payment_provider text,
  customer_id text,
  provider_subscription_id text,
  price_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.plan, s.status, s.billing_cycle,
    s.trial_start, s.trial_end,
    s.current_period_start, s.current_period_end,
    s.cancel_at_period_end,
    s.payment_provider, s.customer_id,
    s.provider_subscription_id, s.price_id
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_subscription_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subscription_status() TO authenticated;

-- 7. RLS: Allow users to UPDATE their own subscription
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
