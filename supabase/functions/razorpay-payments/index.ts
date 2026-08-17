import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function basicAuthHeader() {
  return "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
}

async function razorpayApi(endpoint: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": basicAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// Verify subscription payment signature: subscription_id|payment_id
async function verifyPaymentSignature(subscriptionId: string, paymentId: string, signature: string) {
  const payload = `${subscriptionId}|${paymentId}`;
  const enc = new TextEncoder().encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(RAZORPAY_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

async function verifyWebhookSignature(body: string, signature: string) {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const enc = new TextEncoder().encode(body);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(RAZORPAY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

function computePeriodEnd(billingCycle: string, startDate = new Date()): Date {
  const periodEnd = new Date(startDate);
  if (billingCycle === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  return periodEnd;
}

// Fetch the package from DB by slug (e.g. "starter", "professional", "enterprise")
// Returns the Razorpay plan ID for the selected billing cycle.
async function getPackageAndPlanId(supabaseAdmin: any, planSlug: string, billingCycle: string) {
  const { data: pkg, error } = await supabaseAdmin
    .from("packages")
    .select("id, name, slug, razorpay_plan_id_monthly, razorpay_plan_id_yearly, price_monthly, price_yearly")
    .eq("slug", planSlug)
    .maybeSingle();

  if (error || !pkg) {
    throw new Error(`Invalid plan: ${planSlug}`);
  }

  const planId = billingCycle === "yearly" ? pkg.razorpay_plan_id_yearly : pkg.razorpay_plan_id_monthly;
  if (!planId) {
    throw new Error(`RAZORPAY_PLAN_NOT_CONFIGURED: Plan "${planSlug}" (${billingCycle}) has no Razorpay plan ID.`);
  }

  const amount = billingCycle === "yearly" ? Number(pkg.price_yearly) : Number(pkg.price_monthly);

  return { pkg, planId, amount };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() ?? "";

    // ════════════════════════════════════════════
    // WEBHOOK ENDPOINT (no auth, signature-verified)
    // ════════════════════════════════════════════
    if (path === "webhook") {
      const rawBody = await req.text();
      const signature = req.headers.get("X-Razorpay-Signature") ?? "";

      const valid = await verifyWebhookSignature(rawBody, signature);
      if (!valid) {
        return json({ error: "Invalid webhook signature" }, 401);
      }

      const event = JSON.parse(rawBody);
      const eventType = event.event ?? "";
      const payload = event.payload ?? {};
      const paymentEntity = payload.payment?.entity;
      const subscriptionEntity = payload.subscription?.entity;
      const invoiceEntity = payload.invoice?.entity;

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Helper: find user's subscription by razorpay_subscription_id
      async function findSubByRzpId(rzpSubId: string) {
        const { data } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id")
          .eq("razorpay_subscription_id", rzpSubId)
          .maybeSingle();
        return data;
      }

      // ── subscription.activated / subscription.charged ──
      if (eventType === "subscription.activated" || eventType === "subscription.charged") {
        const subId = subscriptionEntity?.id;
        const customerId = subscriptionEntity?.customer_id;
        const currentStart = subscriptionEntity?.current_start;
        const currentEnd = subscriptionEntity?.current_end;
        const rzpPlanId = subscriptionEntity?.plan_id;
        const paymentId = invoiceEntity?.payment_id ?? paymentEntity?.id ?? "";

        const localSub = subId ? await findSubByRzpId(subId) : null;

        if (localSub) {
          const periodStart = currentStart ? new Date(currentStart * 1000).toISOString() : new Date().toISOString();
          const periodEnd = currentEnd ? new Date(currentEnd * 1000).toISOString() : computePeriodEnd("monthly").toISOString();

          await supabaseAdmin.from("subscriptions")
            .update({
              status: "active",
              razorpay_customer_id: customerId,
              razorpay_plan_id: rzpPlanId,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", localSub.id);

          // Idempotent payment record
          if (paymentId) {
            const { data: existingPayment } = await supabaseAdmin.from("payments")
              .select("id")
              .eq("razorpay_payment_id", paymentId)
              .maybeSingle();

            if (!existingPayment) {
              await supabaseAdmin.from("payments").insert({
                user_id: localSub.user_id,
                subscription_id: localSub.id,
                razorpay_payment_id: paymentId,
                razorpay_subscription_id: subId,
                razorpay_invoice_id: invoiceEntity?.id ?? null,
                amount: invoiceEntity?.amount ? Number(invoiceEntity.amount) / 100 : null,
                currency: "INR",
                status: "paid",
                payment_type: "subscription",
                billing_cycle: subscriptionEntity?.notes?.billing_cycle ?? "monthly",
                paid_at: new Date().toISOString(),
              });
            }
          }
        }
        return json({ received: true });
      }

      // ── subscription.authenticated ──
      // Only record the customer id; never downgrade an already-active
      // subscription. Setting status here would race with the
      // subscription.activated webhook and flip a paid sub back to pending.
      if (eventType === "subscription.authenticated") {
        const subId = subscriptionEntity?.id;
        const customerId = subscriptionEntity?.customer_id;
        const localSub = subId ? await findSubByRzpId(subId) : null;
        if (localSub) {
          await supabaseAdmin.from("subscriptions")
            .update({
              razorpay_customer_id: customerId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", localSub.id);
        }
        return json({ received: true });
      }

      // ── payment.captured ──
      if (eventType === "payment.captured" || eventType === "payment.authorized") {
        const paymentId = paymentEntity?.id;
        const subId = paymentEntity?.subscription_id ?? subscriptionEntity?.id;
        if (paymentId && subId) {
          const localSub = await findSubByRzpId(subId);
          if (localSub) {
            const { data: existingPayment } = await supabaseAdmin.from("payments")
              .select("id")
              .eq("razorpay_payment_id", paymentId)
              .maybeSingle();
            if (!existingPayment) {
              await supabaseAdmin.from("payments").insert({
                user_id: localSub.user_id,
                subscription_id: localSub.id,
                razorpay_payment_id: paymentId,
                razorpay_subscription_id: subId,
                amount: paymentEntity?.amount ? Number(paymentEntity.amount) / 100 : null,
                currency: "INR",
                status: "paid",
                payment_type: "subscription",
                paid_at: new Date().toISOString(),
              });
            }
          }
        }
        return json({ received: true });
      }

      // ── payment.failed ──
      if (eventType === "payment.failed") {
        const subId = paymentEntity?.subscription_id ?? subscriptionEntity?.id;
        const paymentId = paymentEntity?.id;
        const localSub = subId ? await findSubByRzpId(subId) : null;
        if (localSub) {
          await supabaseAdmin.from("subscriptions")
            .update({ status: "payment_failed", updated_at: new Date().toISOString() })
            .eq("id", localSub.id);

          if (paymentId) {
            const { data: existingPayment } = await supabaseAdmin.from("payments")
              .select("id")
              .eq("razorpay_payment_id", paymentId)
              .maybeSingle();
            if (!existingPayment) {
              await supabaseAdmin.from("payments").insert({
                user_id: localSub.user_id,
                subscription_id: localSub.id,
                razorpay_payment_id: paymentId,
                razorpay_subscription_id: subId,
                amount: paymentEntity?.amount ? Number(paymentEntity.amount) / 100 : null,
                currency: "INR",
                status: "failed",
                payment_type: "subscription",
              });
            }
          }
        }
        return json({ received: true });
      }

      // ── subscription.cancelled ──
      if (eventType === "subscription.cancelled") {
        const subId = subscriptionEntity?.id;
        const localSub = subId ? await findSubByRzpId(subId) : null;
        if (localSub) {
          await supabaseAdmin.from("subscriptions")
            .update({
              status: "cancelled",
              cancel_at_period_end: false,
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", localSub.id);
        }
        return json({ received: true });
      }

      // ── subscription.expired ──
      if (eventType === "subscription.expired") {
        const subId = subscriptionEntity?.id;
        const localSub = subId ? await findSubByRzpId(subId) : null;
        if (localSub) {
          await supabaseAdmin.from("subscriptions")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", localSub.id);
        }
        return json({ received: true });
      }

      // ── subscription.paused / subscription.pending ──
      // Never downgrade an already-active subscription; only halt subs that
      // are not yet active (e.g. pending payment). Razorpay may emit these
      // events during the auth flow, and overwriting an active sub would kick
      // the user back to the Choose Plan screen.
      if (eventType === "subscription.paused" || eventType === "subscription.pending") {
        const subId = subscriptionEntity?.id;
        const localSub = subId ? await findSubByRzpId(subId) : null;
        if (localSub) {
          const { data: current } = await supabaseAdmin.from("subscriptions")
            .select("status")
            .eq("id", localSub.id)
            .maybeSingle();
          if (current?.status !== "active") {
            await supabaseAdmin.from("subscriptions")
              .update({ status: "halted", updated_at: new Date().toISOString() })
              .eq("id", localSub.id);
          }
        }
        return json({ received: true });
      }

      return json({ received: true });
    }

    // ════════════════════════════════════════════
    // AUTHENTICATED ACTIONS
    // ════════════════════════════════════════════
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();
    const action = body.action;

    // ── Create Razorpay Subscription ──
    if (action === "create_subscription") {
      const { plan, billingCycle } = body as {
        plan: string;
        billingCycle: "monthly" | "yearly";
      };

      if (!plan || !billingCycle) {
        return json({ error: "Missing plan or billingCycle" }, 400);
      }

      // Get the Razorpay plan ID + package from the database (server-side source of truth)
      let pkgData: { pkg: any; planId: string; amount: number };
      try {
        pkgData = await getPackageAndPlanId(supabaseAdmin, plan, billingCycle);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }

      // Prevent duplicate active subscriptions
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, status, package_id")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .maybeSingle();

      if (existingSub?.status === "active") {
        if (existingSub.package_id === pkgData.pkg.id) {
          return json({ error: "You already have an active subscription for this plan." }, 400);
        }
        return json({ error: "You already have an active subscription. Plan changes will be available after the current billing period." }, 400);
      }
      if (existingSub?.status === "pending") {
        return json({ error: "A subscription payment is already in progress. Please complete it or wait for its status to update." }, 400);
      }

      // Fetch user's email for customer creation
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const customerEmail = profile?.email ?? user.email ?? "";
      const customerName = profile?.full_name ?? "";

      // ── Resolve Razorpay customer ID ──
      let customerId = "";
      const { data: existingCust } = await supabaseAdmin
        .from("subscriptions")
        .select("razorpay_customer_id")
        .eq("user_id", user.id)
        .not("razorpay_customer_id", "is", null)
        .maybeSingle();

      if (existingCust?.razorpay_customer_id) {
        customerId = existingCust.razorpay_customer_id;
      }

      if (!customerId) {
        const customerPayload: Record<string, unknown> = {
          name: customerName || "Customer",
          email: customerEmail,
          notes: { user_id: user.id },
        };
        const customerRes = await razorpayApi("customers", "POST", customerPayload);

        if (customerRes.ok) {
          customerId = customerRes.data.id;
        } else {
          const errDesc = customerRes.data?.error?.description ?? "";
          const errCode = customerRes.data?.error?.code ?? "";
          if (errCode === "BAD_REQUEST_ERROR" && errDesc.includes("Customer already exists")) {
            const lookupRes = await razorpayApi(`customers?email=${encodeURIComponent(customerEmail)}`, "GET");
            if (lookupRes.ok && lookupRes.data?.items?.length > 0) {
              const found = lookupRes.data.items.find((c: any) => c.email === customerEmail);
              if (found) customerId = found.id;
            }
          }
          if (!customerId) {
            return json({ error: "Failed to resolve Razorpay customer" }, 500);
          }
        }
      }

      // Create the Razorpay subscription — no trial, immediate charge
      const subscriptionBody: Record<string, unknown> = {
        plan_id: pkgData.planId,
        customer_notify: 1,
        quantity: 1,
        total_count: billingCycle === "yearly" ? 1 : 12,
        customer_id: customerId,
        notes: {
          user_id: user.id,
          plan,
          billing_cycle: billingCycle,
        },
      };

      const subRes = await razorpayApi("subscriptions", "POST", subscriptionBody);
      if (!subRes.ok) {
        return json({ error: "Failed to create subscription" }, 500);
      }

      const razorpaySubscription = subRes.data;

      // Upsert the local subscription record as pending until payment verified
      if (existingSub) {
        await supabaseAdmin.from("subscriptions")
          .update({
            package_id: pkgData.pkg.id,
            status: "pending",
            billing_cycle: billingCycle,
            razorpay_customer_id: customerId,
            razorpay_subscription_id: razorpaySubscription.id,
            razorpay_plan_id: pkgData.planId,
            current_period_start: new Date().toISOString(),
            current_period_end: computePeriodEnd(billingCycle).toISOString(),
            cancel_at_period_end: false,
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      } else {
        await supabaseAdmin.from("subscriptions").insert({
          user_id: user.id,
          package_id: pkgData.pkg.id,
          status: "pending",
          billing_cycle: billingCycle,
          razorpay_customer_id: customerId,
          razorpay_subscription_id: razorpaySubscription.id,
          razorpay_plan_id: pkgData.planId,
          current_period_start: new Date().toISOString(),
          current_period_end: computePeriodEnd(billingCycle).toISOString(),
          cancel_at_period_end: false,
        });
      }

      return json({
        subscriptionId: razorpaySubscription.id,
        keyId: RAZORPAY_KEY_ID,
        plan,
        billingCycle,
        amount: pkgData.amount,
      });
    }

    // ── Verify Subscription Payment ──
    if (action === "verify_subscription_payment") {
      const { razorpaySubscriptionId, razorpayPaymentId, razorpaySignature, plan, billingCycle } = body as {
        razorpaySubscriptionId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        plan: string;
        billingCycle: "monthly" | "yearly";
      };

      if (!razorpaySubscriptionId || !razorpayPaymentId || !razorpaySignature) {
        return json({ error: "Missing verification fields" }, 400);
      }

      const valid = await verifyPaymentSignature(razorpaySubscriptionId, razorpayPaymentId, razorpaySignature);
      if (!valid) {
        return json({ error: "Payment verification failed" }, 400);
      }

      // Fetch the subscription from Razorpay to get authoritative status
      const subRes = await razorpayApi(`subscriptions/${razorpaySubscriptionId}`, "GET");
      if (!subRes.ok) {
        return json({ error: "Failed to fetch subscription status" }, 500);
      }

      const rzpSubscription = subRes.data;
      const rzpStatus = rzpSubscription.status;
      const currentStart = rzpSubscription.current_start;
      const currentEnd = rzpSubscription.current_end;

      // A valid signature confirms the payment was captured. Set the
      // subscription to active immediately so the user can proceed to
      // onboarding without waiting for the subscription.activated webhook.
      // The webhook will also set it to active (idempotently).
      let ourStatus = "active";
      if (rzpStatus === "cancelled") {
        ourStatus = "cancelled";
      } else if (rzpStatus === "expired" || rzpStatus === "completed") {
        ourStatus = "expired";
      } else if (rzpStatus === "halted") {
        ourStatus = "past_due";
      }

      const periodStart = currentStart ? new Date(currentStart * 1000).toISOString() : new Date().toISOString();
      const periodEnd = currentEnd ? new Date(currentEnd * 1000).toISOString() : computePeriodEnd(billingCycle).toISOString();

      // Get package for this plan slug
      let pkgData: { pkg: any; planId: string; amount: number };
      try {
        pkgData = await getPackageAndPlanId(supabaseAdmin, plan, billingCycle);
      } catch {
        return json({ error: "Invalid plan" }, 400);
      }

      // Idempotent payment record
      const { data: existingPayment } = await supabaseAdmin.from("payments")
        .select("id")
        .eq("razorpay_payment_id", razorpayPaymentId)
        .maybeSingle();

      if (!existingPayment) {
        const { data: localSub } = await supabaseAdmin.from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        await supabaseAdmin.from("payments").insert({
          user_id: user.id,
          subscription_id: localSub?.id ?? null,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_subscription_id: razorpaySubscriptionId,
          amount: pkgData.amount,
          currency: "INR",
          status: ourStatus === "active" ? "paid" : "pending",
          payment_type: "subscription",
          billing_cycle: billingCycle,
          paid_at: ourStatus === "active" ? new Date().toISOString() : null,
        });
      }

      // Update subscription with authoritative Razorpay data
      await supabaseAdmin.from("subscriptions")
        .update({
          status: ourStatus,
          razorpay_subscription_id: razorpaySubscriptionId,
          razorpay_plan_id: pkgData.planId,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return json({
        success: true,
        status: ourStatus,
        plan,
        billingCycle,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
    }

    // ── Cancel Subscription ──
    if (action === "cancel_subscription") {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, razorpay_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sub) {
        return json({ error: "No subscription found" }, 404);
      }

      if (sub.razorpay_subscription_id) {
        const cancelRes = await razorpayApi(
          `subscriptions/${sub.razorpay_subscription_id}/cancel`,
          "POST",
          { cancel_at_cycle_end: 1 },
        );
        if (!cancelRes.ok) {
          console.error("Razorpay cancel failed:", cancelRes.data);
        }
      }

      await supabaseAdmin.from("subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      return json({ success: true, message: "Subscription will cancel at period end" });
    }

    // ── Reactivate Subscription ──
    if (action === "reactivate_subscription") {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, razorpay_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sub) {
        return json({ error: "No subscription found" }, 404);
      }

      await supabaseAdmin.from("subscriptions")
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      return json({ success: true, message: "Subscription reactivated" });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("Edge function error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
