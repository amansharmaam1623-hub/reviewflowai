/*
# Update Enterprise business limit from unlimited to 10

## Changes
- Updates the `enforce_business_limit` RPC function to set Enterprise's
  business limit to 10 (was previously 1000000 / effectively unlimited).
- Starter remains 1, Professional remains 3.
- Also blocks creation for users without an active subscription (incomplete, cancelled, expired, payment_failed).

## Security
- No RLS policy changes.
- The function uses auth.uid() for ownership checks.
- Enterprise users can now create at most 10 businesses, enforced server-side.
*/

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
    WHEN 'enterprise' THEN 10
    ELSE 1
  END;

  RETURN v_current_count < v_limit;
END;
$$;
