/*
# Clean Database Rebuild — ReviewFlow AI

## Purpose
Complete reset of the development database to a clean baseline. Removes old trial logic,
old subscription/payment structures, old Razorpay plan IDs, duplicate migration artifacts,
and conflicting Realtime configuration. Rebuilds 8 application tables cleanly.

## What's Removed
- Old `handle_new_user()` trigger that auto-created a 'trialing' subscription with 7-day trial
- Old `get_subscription_status()` function returning trial columns
- Old `enforce_business_limit()` function using legacy `plan` column
- All trial columns (`trial_start`, `trial_end`) from subscriptions
- Old Razorpay plan IDs from packages table
- Old `cycle_count_monthly`, `cycle_count_yearly` columns from packages
- Old `coupons` table (will be rebuilt in a later step if needed)
- Old `support_tickets` table (not in the clean 8-table spec)
- Old `increment_qr_scan()` function
- Old `update_qr_updated_at()` trigger/function

## New Tables (8 total)
1. profiles — user identity, linked to auth.users
2. packages — 3 plans (Starter, Professional, Enterprise)
3. subscriptions — user subscription state (NO trial)
4. payments — Razorpay payment records
5. businesses — user-owned businesses
6. reviews — reviews linked to businesses
7. qr_codes — QR codes linked to businesses
8. feedback — feedback linked to businesses

## Security
- RLS enabled on all 8 tables
- Owner-scoped policies using auth.uid()
- Packages: read-only for authenticated users
- Subscriptions: read-only for users (status changes via server functions later)
- Payments: read-only for users (records created via server functions later)

## Triggers
- `on_auth_user_created`: creates profile ONLY (no subscription, no trial)
- `set_updated_at`: generic updated_at trigger on all tables with updated_at

## Realtime
- Removes and re-adds reviews, qr_codes, feedback, subscriptions to supabase_realtime
- Idempotent: checks membership before adding

## Plan Seed Data
- Starter: ₹799/mo, ₹7668/yr, 1 business, 100 reviews
- Professional: ₹1699/mo, ₹16308/yr, 3 businesses, unlimited reviews
- Enterprise: ₹5999/mo, ₹57588/yr, 10 businesses, unlimited reviews
- All Razorpay plan IDs left NULL for later configuration
*/

-- ════════════════════════════════════════════════════════════
-- STEP 1: Drop old triggers, functions, and tables
-- ════════════════════════════════════════════════════════════

-- Drop old auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_status() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_business_limit() CASCADE;
DROP FUNCTION IF EXISTS public.increment_qr_scan(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_qr_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Drop old triggers on tables
DROP TRIGGER IF EXISTS trg_qr_updated_at ON public.qr_codes;

-- Remove tables from Realtime publication (conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reviews') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.reviews;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'qr_codes') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.qr_codes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'feedback') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.feedback;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'businesses') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.businesses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payments') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.payments;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'packages') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.packages;
  END IF;
END $$;

-- Drop all existing application tables (CASCADE handles FK dependencies)
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.qr_codes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ════════════════════════════════════════════════════════════
-- STEP 2: Create clean tables
-- ════════════════════════════════════════════════════════════

-- ── 1. profiles ──
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  phone text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'business' CHECK (role IN ('business', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. packages ──
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  razorpay_plan_id_monthly text,
  razorpay_plan_id_yearly text,
  business_limit integer NOT NULL,
  review_limit integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. subscriptions ──
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'payment_failed', 'cancelled', 'expired', 'halted')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  razorpay_customer_id text,
  razorpay_subscription_id text,
  razorpay_plan_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. payments ──
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  razorpay_payment_id text UNIQUE,
  razorpay_subscription_id text,
  razorpay_invoice_id text,
  amount numeric,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  payment_type text,
  billing_cycle text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 5. businesses ──
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  google_business_url text,
  google_place_id text,
  category text,
  address text,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 6. reviews ──
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer,
  review_text text,
  source text,
  sentiment text,
  status text NOT NULL DEFAULT 'new',
  response_text text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 7. qr_codes ──
CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier text NOT NULL DEFAULT '',
  target_url text,
  scan_count integer NOT NULL DEFAULT 0,
  last_scan_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 8. feedback ──
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer,
  feedback_text text,
  source text NOT NULL DEFAULT 'qr',
  customer_name text,
  customer_email text,
  sentiment text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- STEP 3: Indexes
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON public.qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON public.feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON public.packages(slug);

-- ════════════════════════════════════════════════════════════
-- STEP 4: Enable RLS on all tables
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- STEP 5: RLS Policies
-- ════════════════════════════════════════════════════════════

-- ── profiles: read/update own ──
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── packages: read-only for authenticated (active packages) ──
DROP POLICY IF EXISTS "packages_select_active" ON public.packages;
CREATE POLICY "packages_select_active" ON public.packages FOR SELECT
  TO authenticated USING (is_active = true);

-- Admins can read all packages (including inactive)
DROP POLICY IF EXISTS "packages_select_admin" ON public.packages;
CREATE POLICY "packages_select_admin" ON public.packages FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── subscriptions: read own only ──
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ── payments: read own only ──
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ── businesses: full CRUD for owner ──
DROP POLICY IF EXISTS "businesses_select_own" ON public.businesses;
CREATE POLICY "businesses_select_own" ON public.businesses FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "businesses_insert_own" ON public.businesses;
CREATE POLICY "businesses_insert_own" ON public.businesses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "businesses_update_own" ON public.businesses;
CREATE POLICY "businesses_update_own" ON public.businesses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "businesses_delete_own" ON public.businesses;
CREATE POLICY "businesses_delete_own" ON public.businesses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── reviews: access via own businesses ──
DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── qr_codes: access via own businesses ──
DROP POLICY IF EXISTS "qr_codes_select_own" ON public.qr_codes;
CREATE POLICY "qr_codes_select_own" ON public.qr_codes FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "qr_codes_insert_own" ON public.qr_codes;
CREATE POLICY "qr_codes_insert_own" ON public.qr_codes FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "qr_codes_update_own" ON public.qr_codes;
CREATE POLICY "qr_codes_update_own" ON public.qr_codes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "qr_codes_delete_own" ON public.qr_codes;
CREATE POLICY "qr_codes_delete_own" ON public.qr_codes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── feedback: access via own businesses ──
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = feedback.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "feedback_update_own" ON public.feedback;
CREATE POLICY "feedback_update_own" ON public.feedback FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_delete_own" ON public.feedback;
CREATE POLICY "feedback_delete_own" ON public.feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- STEP 6: Functions and Triggers
-- ════════════════════════════════════════════════════════════

-- ── Generic updated_at trigger function ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Auth user trigger: create profile ONLY (no subscription, no trial) ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── updated_at triggers on all tables with updated_at ──
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════
-- STEP 7: Seed Plan Data
-- ════════════════════════════════════════════════════════════

INSERT INTO public.packages (name, slug, description, price_monthly, price_yearly, business_limit, review_limit, features, is_active, sort_order) VALUES
  ('Starter', 'starter', 'Perfect for small businesses getting started with review management', 799, 7668, 1, 100, '{"features": ["1 Business", "100 reviews/month", "QR code generation", "Basic analytics", "Email support"]}'::jsonb, true, 1),
  ('Professional', 'professional', 'For growing businesses that need more capacity and advanced features', 1699, 16308, 3, NULL, '{"features": ["3 Businesses", "Unlimited reviews", "QR code generation", "Advanced analytics", "AI response suggestions", "Priority support"]}'::jsonb, true, 2),
  ('Enterprise', 'enterprise', 'For large operations managing multiple locations', 5999, 57588, 10, NULL, '{"features": ["10 Businesses", "Unlimited reviews", "QR code generation", "Advanced analytics", "AI response suggestions", "Custom branding", "API access", "Dedicated support"]}'::jsonb, true, 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  business_limit = EXCLUDED.business_limit,
  review_limit = EXCLUDED.review_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ════════════════════════════════════════════════════════════
-- STEP 8: Realtime Configuration (idempotent)
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'qr_codes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_codes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'feedback') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;
