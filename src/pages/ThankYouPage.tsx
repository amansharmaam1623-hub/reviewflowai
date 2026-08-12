import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/usePageMeta';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export function ThankYouPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const access = useSubscriptionAccess();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  usePageMeta('Payment Successful | ReviewFlow AI', 'Your ReviewFlow AI subscription is now active.');

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, session, navigate]);

  // Poll for webhook sync until the subscription flips to active, then
  // auto-redirect to onboarding (or dashboard if already onboarded).
  // We never send the user back to Choose Plan from here.
  useEffect(() => {
    if (authLoading || access.loading) return;
    if (!session) return;

    if (access.isActive) {
      setShowDetails(true);
      if (!redirecting) {
        setRedirecting(true);
        const dest = profile?.onboarding_completed ? '/dashboard' : '/onboarding';
        navigate(dest, { replace: true });
      }
      return;
    }

    // Still pending — poll for the webhook to land.
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts += 1;
      await access.refetch();
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setShowDetails(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [authLoading, access.loading, access.isActive, session, profile, redirecting, navigate, access.refetch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const planLabel = PLAN_LABELS[access.plan] ?? access.plan;
  const cycleLabel = access.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur-sm">
        <Logo />
      </header>

      <div className="mx-auto max-w-lg px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 rounded-full bg-google-green/20 blur-2xl scale-150" />
          <div className="relative h-24 w-24 rounded-full bg-google-green/10 flex items-center justify-center">
            <CheckCircle2 className="h-14 w-14 text-google-green" strokeWidth={2} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl md:text-4xl font-extrabold text-ink-800 tracking-tight"
        >
          Payment Successful!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-3 text-ink-500 max-w-sm"
        >
          Your subscription has been activated successfully.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 w-full rounded-2xl bg-white border border-ink-200/70 shadow-card p-6"
        >
          <div className="flex items-center justify-between py-3 border-b border-ink-100">
            <span className="text-sm text-ink-500">Plan</span>
            <span className="text-base font-bold text-ink-800 capitalize">{planLabel}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-ink-100">
            <span className="text-sm text-ink-500">Billing Cycle</span>
            <span className="text-base font-bold text-ink-800">{cycleLabel}</span>
          </div>
          {showDetails && access.currentPeriodEnd && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-ink-500">Renews On</span>
              <span className="text-sm font-semibold text-ink-700">
                {access.currentPeriodEnd.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
          {showDetails && access.status !== 'active' && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-google-blue/5 px-3 py-2">
              <Sparkles className="h-4 w-4 text-google-blue shrink-0" />
              <span className="text-xs text-google-blue font-medium">
                Activating your subscription…
              </span>
            </div>
          )}
        </motion.div>

        {access.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 w-full"
          >
            <Button
              className="w-full"
              size="lg"
              loading={redirecting}
              onClick={() => {
                setRedirecting(true);
                navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
              }}
              rightIcon={!redirecting ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {profile?.onboarding_completed ? 'Go to Dashboard' : 'Continue to Setup'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
