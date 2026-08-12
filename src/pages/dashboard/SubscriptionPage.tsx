import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Lock, Calendar, CreditCard, Receipt, X, AlertCircle, Ban, RotateCcw } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { usePackages, usePayments } from '@/lib/hooks';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { PLAN_ORDER, getPlanConfig, type PlanId } from '@/lib/plans';
import { supabase } from '@/lib/supabase';
import type { Package } from '@/lib/supabase';

function normalizeFeatures(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === 'string');
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (typeof raw === 'object') {
    const inner = (raw as Record<string, unknown>).features;
    if (Array.isArray(inner)) return inner.filter((f): f is string => typeof f === 'string');
    if (typeof inner === 'string') return inner.trim() ? [inner.trim()] : [];
  }
  return [];
}

export function SubscriptionPage() {
  const access = useSubscriptionAccess();
  const { packages } = usePackages();
  const { payments, loading: payLoading, refetch: refetchPays } = usePayments();
  const { refreshProfile } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<Package | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const sortedPackages = useMemo(() =>
    [...packages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [packages]);

  const getPrice = (pkg: Package) =>
    billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly;

  const openCheckout = (pkg: Package) => {
    setError(null);
    setCheckoutPlan(pkg);
  };

  const closeCheckout = () => {
    if (processing) return;
    setCheckoutPlan(null);
    setError(null);
  };

  const handlePayment = async () => {
    if (!checkoutPlan) return;
    setProcessing(true);
    setError(null);

    try {
      const planSlug = checkoutPlan.slug;

      // Create a Razorpay subscription (recurring), not a one-time order
      const { data: subData, error: subError } = await supabase.functions.invoke('razorpay-payments', {
        body: { action: 'create_subscription', plan: planSlug, billingCycle },
      });

      if (subError || !subData?.subscriptionId) {
        const msg = subError?.message || subData?.error || 'Failed to create subscription. Please try again.';
        setError(msg);
        setProcessing(false);
        return;
      }

      const razorpay = (window as any).Razorpay;
      if (!razorpay) {
        setError('Payment gateway not loaded. Please refresh and try again.');
        setProcessing(false);
        return;
      }

      // For subscription checkout, Razorpay uses subscription_id instead of order_id
      const options = {
        key: subData.keyId,
        subscription_id: subData.subscriptionId,
        name: 'ReviewFlow AI',
        description: `${checkoutPlan.name} Plan — ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        handler: async (response: any) => {
          // Verify the subscription payment server-side
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-payments', {
            body: {
              action: 'verify_subscription_payment',
              razorpaySubscriptionId: response.razorpay_subscription_id || subData.subscriptionId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: planSlug,
              billingCycle,
            },
          });

          if (verifyError || !verifyData?.success) {
            setError('Payment verification failed. Your plan was not upgraded. If you were charged, please contact support.');
            setProcessing(false);
            return;
          }

          if (verifyData.status !== 'active') {
            setError('Payment is still being processed. Please wait a moment and refresh.');
            setProcessing(false);
            return;
          }

          await Promise.all([access.refetch(), refetchPays(), refreshProfile()]);
          setProcessing(false);
          setCheckoutPlan(null);
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled. You remain on your current plan.');
          },
        },
        theme: { color: '#4285F4' },
      };

      const rzp = new razorpay(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again with a different payment method.');
        setProcessing(false);
      });
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const { error: cancelError } = await supabase.functions.invoke('razorpay-payments', {
        body: { action: 'cancel_subscription' },
      });
      if (cancelError) {
        setError('Failed to cancel subscription. Please try again.');
        setCanceling(false);
        return;
      }
      await access.refetch();
      setShowCancelModal(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setCanceling(false);
    }
    setCanceling(false);
  };

  const handleReactivate = async () => {
    setCanceling(true);
    try {
      const { error: reactivateError } = await supabase.functions.invoke('razorpay-payments', {
        body: { action: 'reactivate_subscription' },
      });
      if (reactivateError) {
        setError('Failed to reactivate subscription.');
        setCanceling(false);
        return;
      }
      await access.refetch();
    } catch {
      setError('Something went wrong.');
      setCanceling(false);
    }
    setCanceling(false);
  };

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  if (access.loading) {
    return (
      <>
        <Topbar title="Subscription" subtitle="Manage your plan, billing, and payment methods" />
        <div className="flex items-center justify-center py-20 text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  const statusBadgeColor = access.isActive ? 'green' : access.isPastDue ? 'red' : 'gray';
  const statusLabel = access.isActive ? 'Active' : access.isPastDue ? 'Past Due' : access.status;

  return (
    <>
      <Topbar title="Subscription" subtitle="Manage your plan, billing, and payment methods" />

      {/* Current plan summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-ink-800 capitalize">{access.plan}</h3>
                <Badge color={statusBadgeColor as any}>{statusLabel}</Badge>
              </div>
              <p className="text-sm text-ink-500">
                {access.billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                {access.isActive && access.currentPeriodEnd && !access.cancelAtPeriodEnd && ` · Next billing: ${formatDate(access.currentPeriodEnd)}`}
                {access.isActive && access.cancelAtPeriodEnd && access.currentPeriodEnd && ` · Cancels on ${formatDate(access.currentPeriodEnd)}`}
                {access.isPastDue && ' · Payment required to restore access'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {access.isActive && !access.cancelAtPeriodEnd && access.plan !== 'starter' && (
              <Button variant="outline" size="sm" leftIcon={<Ban className="h-4 w-4" />} onClick={() => setShowCancelModal(true)}>
                Cancel
              </Button>
            )}
            {access.isActive && access.cancelAtPeriodEnd && (
              <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleReactivate} loading={canceling}>
                Reactivate
              </Button>
            )}
          </div>
        </div>

        {access.isPastDue && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
            <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
            <span className="text-sm text-google-red">
              Your last payment failed. Update your payment method and retry to restore full access.
            </span>
          </div>
        )}
      </motion.div>

      {/* Usage this billing period */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-ink-600" />
          <h3 className="text-base font-bold text-ink-800">Usage This Month</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-600">Reviews generated</span>
              <span className="text-sm font-semibold text-ink-800">
                {access.reviewsUsedThisMonth} {access.reviewLimit === -1 ? '/ Unlimited' : `/ ${access.reviewLimit}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-google-blue to-google-green transition-all duration-500"
                style={{ width: `${access.reviewLimit === -1 ? (access.reviewsUsedThisMonth > 0 ? 100 : 0) : Math.min(100, Math.round((access.reviewsUsedThisMonth / access.reviewLimit) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              {access.reviewLimit === -1
                ? 'Unlimited reviews on your plan'
                : access.reviewsRemaining === 0
                  ? 'You have reached your monthly limit. Upgrade for unlimited reviews.'
                  : `${access.reviewsRemaining} reviews remaining this billing period`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink-100">
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Businesses</p>
              <p className="text-lg font-bold text-ink-800">
                {access.businessCount} / {access.businessLimit}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Total Reviews</p>
              <p className="text-lg font-bold text-ink-800">{access.reviewsUsedThisMonth}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-ink-800 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-300'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'bg-ink-800 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-300'}`}
        >
          Yearly
          <span className="ml-1.5 text-xs text-google-green">Save 20%</span>
        </button>
      </div>

      {/* Pricing plans */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {sortedPackages.map((pkg, i) => {
          const planSlug = pkg.slug as PlanId;
          const isCurrent = access.isCurrentPlan(planSlug);
          const canUpgrade = access.canUpgradeTo(planSlug);
          const canDowngrade = access.canDowngradeTo(planSlug);
          const price = getPrice(pkg);
          const highlighted = pkg.slug === 'professional';

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl bg-white border-2 shadow-card p-6 flex flex-col transition-all ${highlighted ? 'border-google-blue' : 'border-ink-200/70'}`}
            >
              {highlighted && (
                <div className="mb-4">
                  <Badge color="blue">Most Popular</Badge>
                </div>
              )}
              <h3 className="text-lg font-bold text-ink-800 mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-ink-800">₹{price}</span>
                <span className="text-sm text-ink-500">/{billingCycle === 'yearly' ? 'mo' : 'month'}</span>
              </div>
              <div className="space-y-2.5 mb-6 flex-1">
                {normalizeFeatures(pkg.features).map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-ink-600">
                    <span className="h-5 w-5 rounded-full bg-google-green/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-google-green" strokeWidth={3} />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-ink-100">
                {isCurrent ? (
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Check className="h-4 w-4 text-google-green" />}>
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button size="sm" className="w-full" leftIcon={<Zap className="h-4 w-4" />} onClick={() => openCheckout(pkg)}>
                    Upgrade to {pkg.name}
                  </Button>
                ) : canDowngrade ? (
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Lock className="h-4 w-4" />} onClick={() => openCheckout(pkg)}>
                    Downgrade to {pkg.name}
                  </Button>
                ) : !access.isActive ? (
                  <Button size="sm" className="w-full" leftIcon={<Zap className="h-4 w-4" />} onClick={() => openCheckout(pkg)}>
                    Subscribe to {pkg.name}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Included
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Billing history */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="h-4 w-4 text-ink-600" />
          <h3 className="text-base font-bold text-ink-800">Billing History</h3>
        </div>
        {payLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-ink-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Receipt className="h-8 w-8 text-ink-300 mb-3" />
            <p className="text-sm text-ink-500">No billing history yet. Your transactions will appear here after your first upgrade.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Cycle</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-3 pr-4 text-ink-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-ink-400" />
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3 pr-4 capitalize text-ink-700 font-medium">{p.payment_type ?? 'subscription'}</td>
                    <td className="py-3 pr-4 capitalize text-ink-600">{p.billing_cycle ?? '—'}</td>
                    <td className="py-3 pr-4 text-ink-700 font-medium">₹{p.amount != null ? Number(p.amount).toLocaleString('en-IN') : '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge color={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'gray'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            onClick={closeCheckout}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white shadow-float border border-ink-200/70 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-google-blue" />
                  <h3 className="text-lg font-bold text-ink-800">
                    {access.canDowngradeTo(checkoutPlan.slug) ? 'Downgrade' : 'Upgrade'} to {checkoutPlan.name}
                  </h3>
                </div>
                <button onClick={closeCheckout} className="h-8 w-8 rounded-lg hover:bg-ink-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>

              <div className="rounded-xl bg-ink-50 border border-ink-200/60 p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-600">Plan</span>
                  <span className="text-sm font-semibold text-ink-800">{checkoutPlan.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-600">Billing</span>
                  <span className="text-sm font-semibold text-ink-800 capitalize">{billingCycle}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-ink-200/60">
                  <span className="text-sm text-ink-600">Amount due</span>
                  <span className="text-xl font-extrabold text-ink-800">₹{Number(getPrice(checkoutPlan)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3 mb-4">
                  <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
                  <span className="text-sm text-google-red">{error}</span>
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handlePayment} loading={processing} leftIcon={processing ? undefined : <Lock className="h-4 w-4" />}>
                {processing ? 'Processing…' : `Subscribe with Razorpay`}
              </Button>
              <p className="mt-3 text-xs text-ink-400 text-center">Secure recurring billing via Razorpay. Charged immediately.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => !canceling && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white shadow-float border border-ink-200/70 p-6 text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl bg-google-red/10 flex items-center justify-center mb-4">
                <Ban className="h-7 w-7 text-google-red" />
              </div>
              <h3 className="text-lg font-bold text-ink-800 mb-2">Cancel Subscription?</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-6">
                Your subscription will remain active until {formatDate(access.currentPeriodEnd)}. After that, your account will move to the Starter plan.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)} disabled={canceling}>
                  Keep Plan
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleCancelSubscription} loading={canceling} leftIcon={!canceling ? <Ban className="h-4 w-4" /> : undefined}>
                  {canceling ? 'Canceling…' : 'Cancel Plan'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
