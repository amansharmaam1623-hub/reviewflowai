/*
# Coupon System

1. New Tables
- `coupons`
  - `id` (uuid, primary key)
  - `code` (text, unique, not null) — normalized to uppercase
  - `discount_type` (text, not null) — 'percentage' | 'fixed'
  - `discount_value` (numeric, not null) — percentage (0-100) or fixed amount in INR
  - `max_uses` (integer, nullable) — null = unlimited
  - `used_count` (integer, default 0)
  - `expires_at` (timestamptz, nullable)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Modified Tables
- `payments` — add columns for coupon tracking:
  - `coupon_code` (text, nullable)
  - `original_amount` (numeric, nullable)
  - `discount_amount` (numeric, nullable)
  - `final_amount` (numeric, nullable)

3. Security
- RLS enabled on `coupons`.
- Admins (role = 'admin' in profiles) get full CRUD via policies using a helper check.
- Authenticated users get SELECT-only (to validate coupon codes client-side if needed).
- All coupon validation and used_count increment happens server-side in the Edge Function.

4. Seed Data
- TEST100: 100% discount, max 100 uses, active.
*/

-- ── coupons table ──
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  max_uses integer NULL,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; authenticated users can read (to validate codes)
DROP POLICY IF EXISTS "admin_all_coupons" ON coupons;
CREATE POLICY "admin_all_coupons" ON coupons FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "auth_read_coupons" ON coupons;
CREATE POLICY "auth_read_coupons" ON coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ── payments table: coupon columns ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'coupon_code') THEN
    ALTER TABLE payments ADD COLUMN coupon_code text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'original_amount') THEN
    ALTER TABLE payments ADD COLUMN original_amount numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'discount_amount') THEN
    ALTER TABLE payments ADD COLUMN discount_amount numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'final_amount') THEN
    ALTER TABLE payments ADD COLUMN final_amount numeric;
  END IF;
END $$;

-- ── Seed TEST100 ──
INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active)
VALUES ('TEST100', 'percentage', 100, 100, true)
ON CONFLICT (code) DO NOTHING;
