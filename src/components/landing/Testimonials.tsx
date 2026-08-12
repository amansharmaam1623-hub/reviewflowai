import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const testimonials = [
  {
    quote: "We went from 40 reviews to over 600 in three months. The AI suggestions make it effortless for customers — they actually post now.",
    name: 'Sarah Mitchell',
    role: 'Owner, Bella\'s Bistro',
    initials: 'SM',
    color: 'google-red',
    rating: 5,
  },
  {
    quote: "The QR code setup took five minutes. Our review velocity tripled and our Google Maps ranking jumped two spots. Game changer.",
    name: 'James Donovan',
    role: 'Marketing Director, FitZone',
    initials: 'JD',
    color: 'google-blue',
    rating: 5,
  },
  {
    quote: "As a multi-location franchise, the analytics dashboard is invaluable. I can see which branches need attention at a glance.",
    name: 'Aisha Kapoor',
    role: 'Operations Lead, CleanCo',
    initials: 'AK',
    color: 'google-green',
    rating: 5,
  },
  {
    quote: "ReviewFlow paid for itself in the first month. New customers constantly mention our reviews before booking.",
    name: 'Rachel Park',
    role: 'Founder, Park Dental',
    initials: 'RP',
    color: 'google-yellow',
    rating: 5,
  },
  {
    quote: "The AI review drafts are surprisingly natural. Customers edit them lightly or post as-is — either way, we win.",
    name: 'Marcus Lee',
    role: 'GM, AutoCare Plus',
    initials: 'ML',
    color: 'google-blue',
    rating: 5,
  },
  {
    quote: "Setup was trivial, the dashboard is beautiful, and support is responsive. This is how SaaS should feel.",
    name: 'Diana Torres',
    role: 'Owner, Bloom Florals',
    initials: 'DT',
    color: 'google-red',
    rating: 5,
  },
];

const colorMap: Record<string, string> = {
  'google-blue': 'bg-google-blue',
  'google-green': 'bg-google-green',
  'google-yellow': 'bg-google-yellow',
  'google-red': 'bg-google-red',
};

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Testimonials"
          title={<>Loved by businesses <span className="gradient-text">everywhere</span></>}
          subtitle="Join thousands of local businesses growing their reputation with ReviewFlow AI."
        />

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="relative rounded-2xl bg-white border border-ink-200/70 p-6 shadow-card hover:shadow-float transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-ink-100" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-google-yellow text-google-yellow" />
                ))}
              </div>
              <p className="text-sm text-ink-700 leading-relaxed mb-5">{t.quote}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-ink-100">
                <div className={`h-10 w-10 rounded-full ${colorMap[t.color]} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-800">{t.name}</div>
                  <div className="text-xs text-ink-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
