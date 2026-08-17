import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, Award } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const reasons = [
  {
    icon: TrendingUp,
    stat: '3.2x',
    label: 'more reviews',
    desc: 'Businesses using ReviewFlow collect 3.2x more reviews on average within the first 90 days.',
    color: 'google-blue',
  },
  {
    icon: Clock,
    stat: '<60s',
    label: 'to post',
    desc: 'The entire review flow takes under a minute — no account creation, no friction, just results.',
    color: 'google-green',
  },
  {
    icon: Users,
    stat: '2,000+',
    label: 'businesses',
    desc: 'From single-location cafes to multi-branch franchises, thousands trust ReviewFlow daily.',
    color: 'google-yellow',
  },
  {
    icon: Award,
    stat: '4.9/5',
    label: 'rating',
    desc: 'Our customers rate us 4.9 out of 5 for ease of use, support, and ROI.',
    color: 'google-red',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'text-google-blue',
  'google-green': 'text-google-green',
  'google-yellow': 'text-[#a86e00]',
  'google-red': 'text-google-red',
};

export function WhyChooseUs() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Why ReviewFlow"
          title={<>Built for businesses that care about <span className="gradient-text">their reputation</span></>}
          subtitle="We obsess over every detail so your customers actually leave reviews — and you actually see the impact."
        />

        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
              className="group relative rounded-2xl bg-white border border-ink-200/70 p-7 shadow-card hover:shadow-float transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: r.color === 'google-blue' ? '#4285F4' : r.color === 'google-green' ? '#34A853' : r.color === 'google-yellow' ? '#FBBC05' : '#EA4335' }} />
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-ink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <r.icon className={`h-7 w-7 ${colorMap[r.color]}`} strokeWidth={2} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${colorMap[r.color]}`}>{r.stat}</span>
                    <span className="text-sm font-semibold text-ink-500">{r.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
