import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const faqs = [
  {
    q: 'How does the AI review generation work?',
    a: 'When a customer scans your QR code, our AI analyzes your business category and generates three personalized review drafts. The customer picks one, can edit it if they want, and posts it directly to Google — all in under a minute.',
  },
  {
    q: 'Do I need a Google Business Profile to use ReviewFlow?',
    a: 'Yes, you need an existing Google Business Profile. During setup you provide your Google review link and maps location, and we connect everything together. The process takes about two minutes.',
  },
  {
    q: 'Can I use ReviewFlow for multiple locations?',
    a: 'Absolutely. The Professional plan supports up to 3 locations, and Enterprise supports unlimited locations. Each location gets its own QR code, analytics, and settings.',
  },
  {
    q: 'How do I get started?',
    a: 'Sign up for an account, verify your email, choose a plan, and complete your payment via Razorpay. After payment, you will be guided through a quick onboarding to set up your business and generate your first QR code.',
  },
  {
    q: 'How do customers post reviews to Google?',
    a: 'After selecting and optionally editing a review draft, the customer taps "Write Review" which redirects them to your Google review page with the text ready to paste and submit.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel or downgrade your plan at any time from your dashboard settings. There are no long-term contracts or cancellation fees.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-ink-50/60">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading
          eyebrow="FAQ"
          title={<>Questions? <span className="gradient-text">We have answers</span></>}
          subtitle="Everything you need to know about ReviewFlow AI. Can't find what you're looking for? Reach out to our team."
        />

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-ink-200/70 shadow-soft overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-base font-semibold text-ink-800">{faq.q}</span>
                <span className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${open === i ? 'bg-google-blue/10' : 'bg-ink-100'}`}>
                  {open === i ? <Minus className="h-4 w-4 text-google-blue" /> : <Plus className="h-4 w-4 text-ink-600" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <p className="px-5 pb-5 text-sm text-ink-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
