import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';

const plans = [
  {
    name: 'Starter',
    price: { monthly: 29, yearly: 24 },
    desc: 'Perfect for a single location getting started with review collection.',
    features: [
      '1 business location',
      'AI review generation',
      'Branded QR code generator',
      'Basic analytics dashboard',
      'Email notifications',
      'Up to 100 reviews/month',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: { monthly: 79, yearly: 65 },
    desc: 'For growing businesses that want advanced analytics and automation.',
    features: [
      'Everything in Starter, plus:',
      '3 business locations',
      'Advanced analytics & trends',
      'AI response suggestions',
      'Review monitoring & alerts',
      'Unlimited reviews',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 199, yearly: 165 },
    desc: 'For franchises and multi-location operations that need full control.',
    features: [
      'Everything in Professional, plus:',
      'Unlimited locations',
      'Team accounts & roles',
      'Custom branding & domains',
      'API access & integrations',
      'Dedicated account manager',
      'SLA & 24/7 support',
    ],
    highlighted: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 md:py-28 bg-ink-50/60">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Simple, transparent <span className="gradient-text">pricing</span></>}
          subtitle="Simple, transparent pricing. Cancel anytime."
        />

        {/* billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!yearly ? 'text-ink-800' : 'text-ink-400'}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative h-7 w-12 rounded-full bg-ink-200 transition-colors data-[on=true]:bg-google-blue"
            data-on={yearly}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft ${yearly ? 'left-6' : 'left-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-ink-800' : 'text-ink-400'}`}>
            Yearly <span className="text-google-green font-semibold">Save 20%</span>
          </span>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl bg-white p-7 ${plan.highlighted ? 'glow-border shadow-float lg:scale-105 lg:-mt-2' : 'border border-ink-200/70 shadow-card'}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-google-blue to-google-green px-4 py-1.5 text-xs font-bold text-white shadow-glow-blue">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft" />
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold text-ink-800">{plan.name}</h3>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed min-h-[40px]">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-ink-800">${yearly ? plan.price.yearly : plan.price.monthly}</span>
                <span className="text-sm text-ink-500">/mo</span>
              </div>
              {yearly && <p className="mt-1 text-xs text-google-green font-medium">Billed annually</p>}

              <Button
                variant={plan.highlighted ? 'primary' : 'outline'}
                className="w-full mt-6"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
              </Button>

              <ul className="mt-7 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlighted ? 'bg-google-blue/15' : 'bg-google-green/10'}`}>
                      <Check className={`h-3 w-3 ${plan.highlighted ? 'text-google-blue' : 'text-google-green'}`} strokeWidth={3} />
                    </span>
                    <span className={f.endsWith(':') ? 'font-bold text-ink-800' : 'text-ink-600'}>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
