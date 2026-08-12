import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { usePackages } from '@/lib/hooks';
import { PLAN_CONFIG, PLAN_ORDER, type PlanId } from '@/lib/plans';
import { supabase, type Package } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/usePageMeta';

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

export function ChoosePlanPage() {
  const { user, profile, loading: authLoading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  const { packages } = usePackages();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<Package | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta('Choose Your Plan | ReviewFlow AI', 'Select a ReviewFlow AI plan that fits your business. Pay securely with Razorpay.');

  useEffect(() => {
    if (authLoading || access.loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!emailVerified) {
      navigate('/verify-email', { replace: true });
      return;
    }
    if (access.isActive && profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (access.isActive && !profile?.onboarding_completed) {
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [authLoading, access.loading, user, emailVerified, access.isActive, profile, navigate]);

  const sortedPackages = [...packages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

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

    const planName = checkoutPlan.slug as PlanId;

    setProcessing(true);
    setError(null);

    try {
      const { data: subData, error: subError } = await supabase.functions.invoke('razorpay-payments', {
        body: { action: 'create_subscription', plan: planName, billingCycle },
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

      const options = {
        key: subData.keyId,
        subscription_id: subData.subscriptionId,
        name: 'ReviewFlow AI',
        description: `${checkoutPlan.name} Plan — ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        handler: async (response: any) => {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-payments', {
            body: {
              action: 'verify_subscription_payment',
              razorpaySubscriptionId: response.razorpay_subscription_id || subData.subscriptionId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: planName,
              billingCycle,
            },
          });

          if (verifyError || !verifyData?.success) {
            setError('Payment verification failed. If you were charged, please contact support.');
            setProcessing(false);
            return;
          }

          // Re-fetch subscription from Supabase so the thank-you page starts with
          // the freshest state. The webhook may still be in flight, so we do not
          // require status === 'active' here — ThankYouPage polls until active.
          await access.refetch();
          setProcessing(false);
          setCheckoutPlan(null);
          navigate('/thank-you', { replace: true });
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled. You need an active subscription to continue.');
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

  if (authLoading || access.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur-sm">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Sign out
        </Button>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-google-blue/10 px-4 py-1.5 text-sm font-semibold text-google-blue mb-4"
          >
            <Lock className="h-3.5 w-3.5" />
            Subscription Required
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-ink-800 tracking-tight"
          >
            Choose your plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-ink-500 max-w-lg mx-auto"
          >
            Select a plan to activate your subscription. Payment is required before you can access your dashboard.
          </motion.p>
        </div>

        {/* billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-ink-800' : 'text-ink-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative h-7 w-12 rounded-full bg-ink-200 transition-colors data-[on=true]:bg-google-blue"
            data-on={billingCycle === 'yearly'}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft ${billingCycle === 'yearly' ? 'left-6' : 'left-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-ink-800' : 'text-ink-400'}`}>
            Yearly <span className="text-google-green font-semibold">Save 20%</span>
          </span>
        </div>

        {/* plans */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLAN_ORDER.map((planId, i) => {
            const config = PLAN_CONFIG[planId];
            const pkg = sortedPackages.find((p) => p.slug === planId);
            const displayPrice = billingCycle === 'yearly' ? config.priceYearly : config.priceMonthly;
            const isHighlighted = config.id === 'professional';

            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl bg-white p-7 ${isHighlighted ? 'glow-border shadow-float md:scale-105' : 'border border-ink-200/70 shadow-card'}`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-google-blue to-google-green px-4 py-1.5 text-xs font-bold text-white shadow-glow-blue">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft" />
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-ink-800">{config.name}</h3>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-ink-800">₹{displayPrice}</span>
                  <span className="text-sm text-ink-500">/mo</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="mt-1 text-xs text-google-green font-medium">
                    ₹{config.priceYearlyTotal.toLocaleString('en-IN')}/year
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-500">
                  {config.businessLimit === 10 ? 'Up to 10' : config.businessLimit} business{config.businessLimit > 1 ? 'es' : ''}
                </p>

                <Button
                  variant={isHighlighted ? 'primary' : 'outline'}
                  className="w-full mt-6"
                  onClick={() => pkg && openCheckout(pkg)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Choose {config.name}
                </Button>

                <ul className="mt-7 space-y-3">
                  {normalizeFeatures(pkg?.features).map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isHighlighted ? 'bg-google-blue/15' : 'bg-google-green/10'}`}>
                        <Check className={`h-3 w-3 ${isHighlighted ? 'text-google-blue' : 'text-google-green'}`} strokeWidth={3} />
                      </span>
                      <span className="text-ink-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 max-w-md mx-auto flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
            <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
            <span className="text-sm text-google-red">{error}</span>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-800/40 backdrop-blur-sm" onClick={closeCheckout} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-float border border-ink-200/70 p-8 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-ink-800 mb-2">Confirm your subscription</h2>
            <p className="text-sm text-ink-500 mb-6">
              You're subscribing to the <span className="font-semibold text-ink-800">{checkoutPlan.name}</span> plan ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing).
            </p>

            <div className="rounded-xl bg-ink-50 border border-ink-200/70 p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">{checkoutPlan.name} — {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                <span className="text-lg font-bold text-ink-800">
                  ₹{(billingCycle === 'yearly' ? checkoutPlan.price_yearly : checkoutPlan.price_monthly).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              loading={processing}
              rightIcon={!processing ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {processing ? 'Processing…' : 'Pay with Razorpay'}
            </Button>
            <button onClick={closeCheckout} className="w-full mt-3 text-sm text-ink-500 hover:text-ink-800 transition-colors">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
