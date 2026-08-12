import { motion } from 'framer-motion';
import { Target, Eye, Star, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { CTASection } from '@/components/public/CTASection';
import { usePageMeta } from '@/lib/usePageMeta';

const values = [
  {
    icon: Target,
    color: 'google-blue',
    title: 'Our Mission',
    desc: 'To make reputation management effortless for every local business, so owners can focus on what they do best — serving their customers.',
  },
  {
    icon: Eye,
    color: 'google-green',
    title: 'Our Vision',
    desc: 'A world where every great business has the online reputation it deserves, and every customer voice is heard and valued.',
  },
];

const benefits = [
  {
    icon: Star,
    color: 'google-yellow',
    title: 'More Five-Star Reviews',
    desc: 'Remove the friction that stops happy customers from leaving reviews. Our QR flow makes it effortless.',
  },
  {
    icon: Zap,
    color: 'google-blue',
    title: 'Save Time with AI',
    desc: 'AI-generated review suggestions and responses cut hours of manual work down to seconds.',
  },
  {
    icon: TrendingUp,
    color: 'google-green',
    title: 'Grow Your Reputation',
    desc: 'Track rating trends, respond faster, and watch your online reputation improve month over month.',
  },
  {
    icon: Shield,
    color: 'google-red',
    title: 'Stay in Control',
    desc: 'Monitor every review, catch issues early, and maintain a consistent brand voice across all locations.',
  },
  {
    icon: Users,
    color: 'google-blue',
    title: 'Build Customer Trust',
    desc: 'A strong review profile turns first-time visitors into loyal customers and advocates for your business.',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue/10 text-google-blue',
  'google-green': 'bg-google-green/10 text-google-green',
  'google-yellow': 'bg-google-yellow/20 text-[#a86e00]',
  'google-red': 'bg-google-red/10 text-google-red',
};

export function AboutPage() {
  usePageMeta(
    'About Us | ReviewFlow AI',
    'ReviewFlow AI helps local businesses manage their online reputation with AI-powered review collection, response generation, and analytics.',
  );

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrow="About Us"
        title={<>Reputation management, <span className="gradient-text">reimagined</span></>}
        subtitle="ReviewFlow AI was built to solve a simple but stubborn problem: most happy customers never leave reviews, and businesses have no easy way to change that."
      />

      {/* The problem */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-ink-50 border border-ink-200/70 p-8 md:p-10"
          >
            <h2 className="text-2xl font-bold text-ink-800 mb-4">The problem we solve</h2>
            <p className="text-ink-600 leading-relaxed">
              Local businesses thrive on word-of-mouth, but online reviews are hard to collect. Customers are
              busy, the process takes too many steps, and most never get around to it. Meanwhile, a business's
              online reputation — visible to every potential customer who searches — falls behind the quality of
              service they actually deliver. The result: great businesses lose customers to competitors with
              better reviews, not better service.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-ink-200/70 p-8 shadow-card"
              >
                <div className={`mb-5 h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[v.color]}`}>
                  <v.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-ink-800 mb-3">{v.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AI matters */}
      <section className="py-12 md:py-16 bg-ink-50/60">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-ink-800 mb-4">Why AI-powered reputation management matters</h2>
            <p className="text-ink-600 leading-relaxed max-w-2xl mx-auto">
              AI removes the friction from both sides of the review equation. For customers, it eliminates the
              blank-page problem by suggesting what to write. For businesses, it turns hours of review monitoring
              and response drafting into seconds. The result is a reputation that finally reflects the quality of
              your work — without the manual effort.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="group rounded-2xl bg-white border border-ink-200/70 p-6 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mb-5 h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[b.color]} transition-transform group-hover:scale-110`}>
                  <b.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-ink-800 mb-2">{b.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </PublicPageLayout>
  );
}
