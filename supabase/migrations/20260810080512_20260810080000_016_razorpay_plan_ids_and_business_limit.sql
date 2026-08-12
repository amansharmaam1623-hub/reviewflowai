/*
# Razorpay Plan IDs + Business Limit Enforcement

1. Updates packages with real Razorpay plan IDs
2. Creates check_business_limit() SECURITY DEFINER function for server-side enforcement
*/

-- ── Update Razorpay plan IDs ──
UPDATE packages SET razorpay_plan_id_monthly = 'plan_TNaJj6aBrZtpXF', razorpay_plan_id_yearly = 'plan_TNaKSdiCDHR6c3', updated_at = now() WHERE slug = 'starter';
UPDATE packages SET razorpay_plan_id_monthly = 'plan_TNaKzXfDv0DhHf', razorpay_plan_id_yearly = 'plan_TNaLNckwPiNuiy', updated_at = now() WHERE slug = 'professional';
UPDATE packages SET razorpay_plan_id_monthly = 'plan_TNaLxXUrfRPM4c', razorpay_plan_id_yearly = 'plan_TNaN6e8EKFitcg', updated_at = now() WHERE slug = 'enterprise';

-- ── Business limit enforcement function ──
-- Called from client via RPC. Returns true if user can create a new business.
-- SECURITY DEFINER so it can read subscriptions + packages regardless of RLS.
CREATE OR REPLACE FUNCTION public.check_business_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_package_business_limit int;
  v_current_count int;
  v_sub_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get the user's active subscription and package business limit
  SELECT s.status, p.business_limit
  INTO v_sub_status, v_package_business_limit
  FROM subscriptions s
  JOIN packages p ON p.id = s.package_id
  WHERE s.user_id = v_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC LIMIT 1;

  -- If no active subscription, no businesses allowed
  IF v_sub_status IS NULL OR v_sub_status != 'active' THEN
    RETURN false;
  END IF;

  -- Count current businesses
  SELECT count(*) INTO v_current_count FROM businesses WHERE user_id = v_user_id;

  RETURN v_current_count < v_package_business_limit;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_business_limit() TO authenticated;
