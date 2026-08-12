#!/usr/bin/env bash
# Local test for Razorpay webhook signature verification.
# Razorpay signatures are symmetric HMACs, so we can forge a valid one with the
# same secret the function uses - no Razorpay account or public tunnel needed.
#
#   npx supabase functions serve --env-file supabase/functions/.env
#   ./supabase/functions/razorpay-payments/test-webhook.sh
#
# Expected: valid -> 200, tampered -> 401, subscription flips pending -> active.
set -euo pipefail

SECRET="${RAZORPAY_WEBHOOK_SECRET:-local_test_webhook_secret}"
SUB_ID="${SUB_ID:-sub_LOCALTEST123}"
URL="${URL:-http://127.0.0.1:54321/functions/v1/razorpay-payments/webhook}"
DB="${DB:-supabase_db_reviewflowai}"

read -r BODY SIG < <(node -e '
  const {createHmac} = require("node:crypto");
  const now = Math.floor(Date.now()/1000);
  const body = JSON.stringify({
    event: "subscription.charged",
    payload: {
      subscription: {entity: {id: process.argv[1], customer_id: "cust_LOCAL1",
        plan_id: "plan_LOCAL1", current_start: now, current_end: now + 2592000}},
      invoice: {entity: {id: "inv_LOCAL1", payment_id: "pay_LOCAL1", amount: 79900}},
    },
  });
  console.log(body + " " + createHmac("sha256", process.argv[2]).update(body).digest("hex"));
' "$SUB_ID" "$SECRET")

echo "--- valid signature (expect 200) ---"
curl -s -w " <- HTTP %{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" -H "X-Razorpay-Signature: $SIG" --data-binary "$BODY"

echo "--- tampered signature (expect 401) ---"
curl -s -w " <- HTTP %{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" -H "X-Razorpay-Signature: ${SIG:0:63}0" --data-binary "$BODY"

echo "--- resulting subscription ---"
docker exec "$DB" psql -U postgres -c \
  "select status, razorpay_customer_id, current_period_end::date
     from subscriptions where razorpay_subscription_id='$SUB_ID';"
