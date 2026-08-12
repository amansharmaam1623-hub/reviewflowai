import { motion } from 'framer-motion';
import { Sparkles, QrCode, BarChart3, Bell, Shield, Zap } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const features = [
  {
    icon: Sparkles,
    color: 'google-blue',
    title: 'AI Review Generation',
    desc: 'Customers scan a QR code and get three AI-crafted review drafts tailored to your business — they just pick one and post.',
  },
  {
    icon: QrCode,
    color: 'google-green',
    title: 'Smart QR Codes',
    desc: 'Generate branded, downloadable QR codes that link directly to your review flow. Track scans in real time.',
  },
  {
    icon: BarChart3,
    color: 'google-yellow',
    title: 'Review Analytics',
    desc: 'Track ratings, sentiment trends, and growth over time with a clean, actionable analytics dashboard.',
  },
  {
    icon: Bell,
    color: 'google-red',
    title: 'Instant Notifications',
    desc: 'Get alerted the moment a new review lands so you can respond while the customer is still warm.',
  },
  {
    icon: Shield,
    color: 'google-blue',
    title: 'Review Monitoring',
    desc: 'Flag and manage negative reviews before they spread. AI suggests the perfect response for every review.',
  },
  {
    icon: Zap,
    color: 'google-green',
    title: 'Automated Workflows',
    desc: 'Set up review request sequences, reminders, and follow-ups that run on autopilot across your locations.',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue/10 text-google-blue',
  'google-green': 'bg-google-green/10 text-google-green',
  'google-yellow': 'bg-google-yellow/20 text-[#a86e00]',
  'google-red': 'bg-google-red/10 text-google-red',
};

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Features"
          title={<>Everything you need to <span className="gradient-text">grow your reputation</span></>}
          subtitle="From AI-generated reviews to real-time analytics, ReviewFlow gives you the tools to build trust and win more customers."
        />

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
