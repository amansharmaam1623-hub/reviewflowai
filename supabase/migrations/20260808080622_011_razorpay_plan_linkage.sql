/*
# Razorpay Subscription Plan Linkage

## Overview
Adds a `razorpay_plan_id` column to the `packages` table so we can cache
the Razorpay plan ID for each pricing plan. This is needed for the Razorpay
Subscriptions API flow where plans must be registered in Razorpay Dashboard
and linked to our local pricing tiers.

## Changes
1. `packages.razorpay_plan_id` (text) — stores the Razorpay plan ID
   for monthly billing. NULL means the plan hasn't been registered yet.
2. `packages.razorpay_plan_id_yearly` (text) — stores the Razorpay plan ID
   for yearly billing.

## Notes
These columns are informational caches. The edge function will look up
plans by name and use the configured Razorpay plan IDs. If a plan ID
is not yet set, the edge function will return an error telling the
user to register the plan in Razorpay Dashboard.
*/

ALTER TABLE packages ADD COLUMN IF NOT EXISTS razorpay_plan_id text DEFAULT '';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS razorpay_plan_id_yearly text DEFAULT '';
