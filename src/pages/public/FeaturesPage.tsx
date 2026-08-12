import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, QrCode, BarChart3, LayoutDashboard, Inbox, BellRing, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { CTASection } from '@/components/public/CTASection';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/usePageMeta';

const features = [
  {
    icon: MessageSquare,
    color: 'google-blue',
    title: 'AI Review Responses',
    desc: 'Generate professional, context-aware replies to customer reviews in seconds. Our AI analyzes the review tone and content to craft the perfect response every time.',
  },
  {
    icon: Sparkles,
    color: 'google-green',
    title: 'AI Review Suggestions',
    desc: 'When customers scan your QR code, AI creates three personalized review drafts based on your business category and their experience — they just pick one and post.',
  },
  {
    icon: BarChart3,
    color: 'google-yellow',
    title: 'Google Review Management',
    desc: 'Monitor, respond to, and analyze all your Google reviews from a single dashboard. Stay on top of ratings, sentiment, and trends across every location.',
  },
  {
    icon: QrCode,
    color: 'google-red',
    title: 'QR Code Review Collection',
    desc: 'Generate branded, downloadable QR codes that link directly to your review flow. Place them at your counter, on receipts, or in packaging — track scans in real time.',
  },
  {
    icon: BarChart3,
    color: 'google-blue',
    title: 'Review Analytics',
    desc: 'Track ratings, sentiment trends, and growth over time with a clean, actionable analytics dashboard. Understand what drives your reputation.',
  },
  {
    icon: LayoutDashboard,
    color: 'google-green',
    title: 'Business Reputation Dashboard',
    desc: 'A unified view of your online reputation across all locations. See review volume, average ratings, response rates, and sentiment at a glance.',
  },
  {
    icon: Inbox,
    color: 'google-yellow',
    title: 'Feedback Inbox',
    desc: 'Collect and manage private customer feedback alongside your public reviews. Identify issues early and turn unhappy customers into loyal advocates.',
  },
  {
    icon: BellRing,
    color: 'google-red',
    title: 'Automated Review Monitoring',
    desc: 'Get alerted the moment a new review lands. AI flags negative reviews and suggests the ideal response so you can act while the customer is still warm.',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue/10 text-google-blue',
  'google-green': 'bg-google-green/10 text-google-green',
  'google-yellow': 'bg-google-yellow/20 text-[#a86e00]',
  'google-red': 'bg-google-red/10 text-google-red',
};

export function FeaturesPage() {
  const navigate = useNavigate();
  usePageMeta(
    'Features | ReviewFlow AI',
    'Explore ReviewFlow AI features: AI review responses, review suggestions, Google review management, QR code collection, analytics, feedback inbox, and automated monitoring.',
  );

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrow="Features"
        title={<>Powerful Tools to <span className="gradient-text">Grow Your Reputation</span></>}
        subtitle="ReviewFlow AI gives local businesses everything they need to collect, manage, and respond to Google reviews — powered by AI, designed for simplicity."
      />

      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="group relative rounded-2xl bg-white border border-ink-200/70 p-6 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mb-5 h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[f.color]} transition-transform group-hover:scale-110`}>
                  <f.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-ink-800 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </PublicPageLayout>
  );
}
