import { motion } from 'framer-motion';
import { QrCode, Sparkles, Check, Star } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const steps = [
  {
    icon: QrCode,
    color: 'google-blue',
    step: '01',
    title: 'Customer scans your QR code',
    desc: 'A branded QR code placed at your counter or receipt opens a beautiful mobile landing page in seconds.',
  },
  {
    icon: Sparkles,
    color: 'google-green',
    step: '02',
    title: 'AI generates review suggestions',
    desc: 'Our AI crafts three personalized review drafts based on your business category and customer experience.',
  },
  {
    icon: Check,
    color: 'google-yellow',
    step: '03',
    title: 'Customer picks, edits, and posts',
    desc: 'They choose a draft, tweak it if they like, then tap "Write Review" to publish directly to Google.',
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue/10 text-google-blue',
  'google-green': 'bg-google-green/10 text-google-green',
  'google-yellow': 'bg-google-yellow/20 text-[#a86e00]',
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative bg-ink-50/60">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="How it works"
          title={<>From scan to five stars in <span className="gradient-text">under a minute</span></>}
          subtitle="No apps to download, no forms to fill out. Just a frictionless experience that turns customers into reviewers."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-6 relative">
          {/* connecting line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-google-blue/30 via-google-green/30 to-google-yellow/30" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className={`relative z-10 mb-6 h-14 w-14 rounded-2xl flex items-center justify-center ${colorMap[s.color]} shadow-card bg-white`}>
                <s.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="text-sm font-bold text-ink-400 mb-2">{s.step}</div>
              <h3 className="text-xl font-bold text-ink-800 mb-3">{s.title}</h3>
              <p className="text-sm text-ink-600 leading-relaxed max-w-xs">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* demo card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 max-w-md mx-auto rounded-2xl bg-white border border-ink-200/70 shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center">
              <Star className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink-800">Bella's Bistro</div>
              <div className="text-xs text-ink-500">Italian Restaurant</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              'Amazing pasta and incredible service — the carbonara was authentic and the staff made us feel at home.',
              'Best Italian in town! Cozy atmosphere, friendly staff, and the tiramisu is to die for.',
              'A hidden gem. Fresh ingredients, generous portions, and the owner personally checked on our table.',
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className={`rounded-xl border p-3 text-xs leading-relaxed ${i === 1 ? 'border-google-blue bg-google-blue/5' : 'border-ink-200 bg-ink-50'}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-google-yellow text-google-yellow" />
                  ))}
                </div>
                {review}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
