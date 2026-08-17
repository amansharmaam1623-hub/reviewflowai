import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { CTASection } from '@/components/public/CTASection';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/usePageMeta';
import { supabase, type Package } from '@/lib/supabase';

const fallbackPlans: Package[] = [
  { id: 'starter', name: 'Starter', slug: 'starter', description: null, price_monthly: 799, price_yearly: 7668, razorpay_plan_id_monthly: null, razorpay_plan_id_yearly: null, business_limit: 1, review_limit: 100, features: { features: ['1 business location', 'AI review generation', 'Branded QR code generator', 'Basic analytics dashboard', 'Email notifications', 'Up to 100 reviews/month'] }, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'professional', name: 'Professional', slug: 'professional', description: null, price_monthly: 1699, price_yearly: 16308, razorpay_plan_id_monthly: null, razorpay_plan_id_yearly: null, business_limit: 3, review_limit: null, features: { features: ['Everything in Starter, plus:', '3 business locations', 'Advanced analytics & trends', 'AI response suggestions', 'Review monitoring & alerts', 'Unlimited reviews', 'Priority support'] }, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'enterprise', name: 'Enterprise', slug: 'enterprise', description: null, price_monthly: 5999, price_yearly: 57588, razorpay_plan_id_monthly: null, razorpay_plan_id_yearly: null, business_limit: 10, review_limit: null, features: { features: ['Everything in Professional, plus:', '10 business locations', 'Team accounts & roles', 'Custom branding & domains', 'API access & integrations', 'Dedicated account manager', 'SLA & 24/7 support'] }, is_active: true, sort_order: 3, created_at: '', updated_at: '' },
];

function getFeatures(plan: Package): string[] {
  if (Array.isArray(plan.features)) return plan.features.filter((feature): feature is string => typeof feature === 'string');
  const features = plan.features.features;
  return Array.isArray(features) ? features.filter((feature): feature is string => typeof feature === 'string') : [];
}

export function PricingPage() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(true);
  const [plans, setPlans] = useState<Package[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);

  usePageMeta('Pricing | ReviewFlow AI', 'Simple, transparent pricing for ReviewFlow AI. Choose Starter, Professional, or Enterprise plans with monthly or yearly billing.');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('packages').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (data && data.length > 0) setPlans(data as Package[]);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicPageLayout>
      <PageHeader eyebrow="Pricing" title={<>Simple, transparent <span className="gradient-text">pricing</span></>} subtitle="Simple, transparent pricing. Cancel anytime." />
      <section className="py-8 md:py-12 bg-ink-50/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!yearly ? 'text-ink-800' : 'text-ink-400'}`}>Monthly</span>
            <button onClick={() => setYearly(!yearly)} className="relative h-7 w-12 rounded-full bg-ink-200 transition-colors data-[on=true]:bg-google-blue" data-on={yearly} aria-label="Toggle billing cycle"><motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft ${yearly ? 'left-6' : 'left-1'}`} /></button>
            <span className={`text-sm font-medium ${yearly ? 'text-ink-800' : 'text-ink-400'}`}>Yearly <span className="text-google-green font-semibold">Save 20%</span></span>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => {
              const highlighted = plan.slug === 'professional';
              return <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className={`relative rounded-2xl bg-white p-7 ${highlighted ? 'glow-border shadow-float lg:scale-105 lg:-mt-2' : 'border border-ink-200/70 shadow-card'}`}>
                {highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-google-blue to-google-green px-4 py-1.5 text-xs font-bold text-white shadow-glow-blue"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft" />Most Popular</span></div>}
                <h3 className="text-lg font-bold text-ink-800">{plan.name}</h3>
                <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-extrabold text-ink-800">₹{Number(yearly ? plan.price_yearly : plan.price_monthly).toLocaleString('en-IN')}</span><span className="text-sm text-ink-500">/{yearly ? 'year' : 'month'}</span></div>
                {yearly && <p className="mt-1 text-xs text-google-green font-medium">Billed annually</p>}
                <p className="mt-2 text-xs text-ink-500">Up to {plan.business_limit} business{plan.business_limit > 1 ? 'es' : ''}</p>
                <Button variant={highlighted ? 'primary' : 'outline'} className="w-full mt-6" onClick={() => navigate('/signup')} rightIcon={<ArrowRight className="h-4 w-4" />} loading={loading}>{plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}</Button>
                <ul className="mt-7 space-y-3">{getFeatures(plan).map((feature, j) => <li key={j} className="flex items-start gap-2.5 text-sm"><span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${highlighted ? 'bg-google-blue/15' : 'bg-google-green/10'}`}><Check className={`h-3 w-3 ${highlighted ? 'text-google-blue' : 'text-google-green'}`} strokeWidth={3} /></span><span className={feature.endsWith(':') ? 'font-bold text-ink-800' : 'text-ink-600'}>{feature}</span></li>)}</ul>
              </motion.div>;
            })}
          </div>
        </div>
      </section>
      <CTASection title="Still have questions?" subtitle="Choose a plan and start collecting more reviews today." secondaryLabel="Read the FAQ" secondaryTo="/faq" />
    </PublicPageLayout>
  );
}
