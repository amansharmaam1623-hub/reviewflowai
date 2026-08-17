/*
# ReviewFlow AI — Full Schema with Auth, RLS, and Role-Based Access

## Overview
Creates the complete database schema for ReviewFlow AI, a SaaS platform for
AI-powered Google Review Management. The schema supports two user roles
("business" and "admin") with strict row-level security so each business only
sees its own data, while admins see aggregated platform-wide data.

## Tables Created
1. `profiles` — extends auth.users with role (business/admin), full name, avatar
2. `businesses` — business info owned by a user (one-to-many: a user can have multiple businesses depending on plan)
3. `reviews` — Google reviews collected for a business
4. `qr_codes` — QR codes generated for a business
5. `subscriptions` — subscription/plan info per user
6. `payments` — payment/invoice records
7. `support_tickets` — support tickets created by users
8. `packages` — predefined pricing plans (platform-level, readable by all)

## Security
- RLS enabled on every table.
- `profiles`: users read/update own profile; admins read all profiles.
- `businesses`: owners full CRUD; admins read all.
- `reviews`, `qr_codes`: scoped through business ownership; admins read all.
- `subscriptions`: users read own; admins read all.
- `payments`: admins read all only (users don't directly access).
- `support_tickets`: users CRUD own tickets; admins read all + update.
- `packages`: readable by all authenticated users (platform catalog).

## Auto-Profile Creation
- A trigger (`handle_new_user`) fires on auth.users INSERT to auto-create a
  profile row with role 'business' and a default 'starter' subscription.
*/

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'business' CHECK (role IN ('business', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  category text DEFAULT '',
  google_profile_link text DEFAULT '',
  google_review_link text DEFAULT '',
  google_maps_location text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  website text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
CREATE POLICY "businesses_select_own" ON businesses FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
CREATE POLICY "businesses_insert_own" ON businesses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "businesses_delete_own" ON businesses;
CREATE POLICY "businesses_delete_own" ON businesses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 3. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_name text DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text text DEFAULT '',
  status text DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'responded')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_own" ON reviews;
CREATE POLICY "reviews_select_own" ON reviews FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = reviews.business_id AND b.user_id = auth.uid())
  );

-- ============================================================
-- 4. QR CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'My QR Code',
  color text DEFAULT '#4285F4',
  active boolean DEFAULT true,
  scans integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_select_own" ON qr_codes;
CREATE POLICY "qr_select_own" ON qr_codes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "qr_insert_own" ON qr_codes;
CREATE POLICY "qr_insert_own" ON qr_codes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "qr_update_own" ON qr_codes;
CREATE POLICY "qr_update_own" ON qr_codes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "qr_delete_own" ON qr_codes;
CREATE POLICY "qr_delete_own" ON qr_codes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = qr_codes.business_id AND b.user_id = auth.uid())
  );

-- ============================================================
-- 5. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'past_due')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_end timestamptz DEFAULT now() + interval '30 days',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  plan text DEFAULT '',
  status text DEFAULT 'paid' CHECK (status IN ('paid', 'failed', 'refunded', 'pending')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_admin" ON payments;
CREATE POLICY "payments_select_admin" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- 7. SUPPORT TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  message text DEFAULT '',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_own" ON support_tickets;
CREATE POLICY "tickets_select_own" ON support_tickets FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "tickets_insert_own" ON support_tickets;
CREATE POLICY "tickets_insert_own" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets_update_own" ON support_tickets;
CREATE POLICY "tickets_update_own" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets_update_admin" ON support_tickets;
CREATE POLICY "tickets_update_admin" ON support_tickets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- 8. PACKAGES (platform catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  highlighted boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages_select_all" ON packages;
CREATE POLICY "packages_select_all" ON packages FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 9. AUTO-PROFILE + SUBSCRIPTION ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle)
  VALUES (NEW.id, 'starter', 'trial', 'monthly');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- ============================================================
-- 11. SEED PACKAGES
-- ============================================================
INSERT INTO packages (name, price_monthly, price_yearly, features, highlighted, sort_order) VALUES
('Starter', 29, 24, ARRAY['1 business location','AI review generation','Branded QR code generator','Basic analytics dashboard','Email notifications','Up to 100 reviews/month'], false, 1),
('Professional', 79, 65, ARRAY['Everything in Starter','3 business locations','Advanced analytics & trends','AI response suggestions','Review monitoring & alerts','Unlimited reviews','Priority support'], true, 2),
('Enterprise', 199, 165, ARRAY['Everything in Professional','Unlimited locations','Team accounts & roles','Custom branding & domains','API access & integrations','Dedicated account manager','SLA & 24/7 support'], false, 3)
ON CONFLICT DO NOTHING;
