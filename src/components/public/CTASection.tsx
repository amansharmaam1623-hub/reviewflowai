import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function CTASection({
  title = 'Start collecting more reviews today',
  subtitle = 'Join thousands of businesses growing their reputation with AI-powered review management.',
  primaryLabel = 'Get started free',
  primaryTo = '/signup',
  secondaryLabel = 'Go to Dashboard',
  secondaryTo = '/dashboard',
}: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 via-ink-800 to-[#1a73e8] p-10 md:p-16 text-center"
        >
          <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-google-blue/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-google-green/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-google-yellow/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto">
              {title}
            </h2>
            <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate(primaryTo)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                {primaryLabel}
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate(secondaryTo)}>
                {secondaryLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
