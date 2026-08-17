import { motion } from 'framer-motion';
import { Link2, QrCode, Star, Sparkles, MessageSquareReply, TrendingUp } from 'lucide-react';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { CTASection } from '@/components/public/CTASection';
import { usePageMeta } from '@/lib/usePageMeta';

const steps = [
  {
    icon: Link2,
    color: 'google-blue',
    step: '01',
    title: 'Connect Your Business',
    desc: 'Sign up and link your Google Business Profile. Add your business name, category, and review link — setup takes about two minutes.',
  },
  {
    icon: QrCode,
    color: 'google-green',
    step: '02',
    title: 'Generate Your Review QR Code',
    desc: 'Create a branded QR code that links directly to your AI-powered review flow. Download and print it for your counter, receipts, or packaging.',
  },
  {
    icon: Star,
    color: 'google-yellow',
    step: '03',
    title: 'Collect Customer Reviews',
    desc: 'Customers scan the QR code, get AI-crafted review suggestions, pick their favorite, and post directly to Google — all in under a minute.',
  },
  {
    icon: Sparkles,
    color: 'google-red',
    step: '04',
    title: 'AI Analyzes Reviews',
    desc: 'Our AI monitors every new review, analyzes sentiment, and suggests the perfect response for each one — positive or negative.',
  },
  {
    icon: MessageSquareReply,
    color: 'google-blue',
    step: '05',
    title: 'Respond & Improve Your Reputation',
    desc: 'Reply to reviews with AI-assisted responses, track your rating trends, and watch your reputation grow over time.',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue/10 text-google-blue',
  'google-green': 'bg-google-green/10 text-google-green',
  'google-yellow': 'bg-google-yellow/20 text-[#a86e00]',
  'google-red': 'bg-google-red/10 text-google-red',
};

export function HowItWorksPage() {
  usePageMeta(
    'How It Works | ReviewFlow AI',
    'Learn how ReviewFlow AI works: connect your business, generate QR codes, collect reviews, let AI analyze them, and respond to grow your reputation.',
  );

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrow="How it works"
        title={<>From scan to five stars in <span className="gradient-text">five simple steps</span></>}
        subtitle="No technical knowledge required. ReviewFlow AI handles the heavy lifting so you can focus on running your business."
      />

      <section className="py-12 md:py-20 bg-ink-50/60">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-7 top-4 bottom-4 w-px bg-gradient-to-b from-google-blue/30 via-google-green/30 to-google-yellow/30 hidden sm:block" />

            <div className="space-y-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex items-start gap-5 sm:gap-6"
                >
                  <div className={`relative z-10 shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center ${colorMap[s.color]} shadow-card bg-white`}>
                    <s.icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-ink-400">{s.step}</span>
                      <h3 className="text-xl font-bold text-ink-800">{s.title}</h3>
                    </div>
                    <p className="text-sm text-ink-600 leading-relaxed max-w-lg">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-xl bg-google-green/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-google-green" />
            </div>
            <p className="text-sm text-ink-600 leading-relaxed">
              Businesses using ReviewFlow AI collect <span className="font-bold text-ink-800">3.2x more reviews</span> on average within the first 90 days.
            </p>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Ready to get started?"
        subtitle="Set up your review flow in minutes and start collecting reviews today."
      />
    </PublicPageLayout>
  );
}
