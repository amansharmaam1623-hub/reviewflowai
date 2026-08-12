/*
# Onboarding support

1. Add onboarding_completed flag to profiles so we can redirect new users
   to the onboarding wizard after signup.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Allow users to update their own onboarding_completed flag
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
