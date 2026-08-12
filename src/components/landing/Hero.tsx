import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const trustLogos = ['TechCrunch', 'Product Hunt', 'Forbes', 'Wired', 'The Verge'];

export function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 h-[420px] w-[420px] rounded-full bg-google-blue/15 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-1/4 h-[380px] w-[380px] rounded-full bg-google-green/15 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/3 h-[340px] w-[340px] rounded-full bg-google-yellow/15 blur-[120px]"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* left: copy */}
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full glass border border-white/60 px-4 py-1.5 text-sm font-medium text-ink-700 shadow-soft mb-6"
            >
              <Sparkles className="h-4 w-4 text-google-blue" />
              AI-powered review generation
              <span className="ml-1 rounded-full bg-google-green/15 px-2 py-0.5 text-xs font-semibold text-google-green">New</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-800 leading-[1.05]"
            >
              Turn happy customers into{' '}
              <span className="gradient-text">five-star reviews</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-ink-600 leading-relaxed max-w-lg"
            >
              ReviewFlow AI helps local businesses collect more Google reviews with AI-generated
              suggestions, smart QR codes, and real-time analytics — all in one elegant dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Button size="lg" onClick={() => navigate('/signup')} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                See customer flow
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex items-center gap-6"
            >
              <div className="flex -space-x-2">
                {['#4285F4', '#34A853', '#FBBC05', '#EA4335'].map((c, i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full ring-2 ring-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: c }}
                  >
                    {['JD', 'SM', 'AK', 'RP'][i]}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-google-yellow text-google-yellow" />
                  ))}
                  <span className="ml-1.5 text-sm font-bold text-ink-800">4.9/5</span>
                </div>
                <span className="text-sm text-ink-500">Trusted by 2,000+ businesses</span>
              </div>
            </motion.div>
          </div>

          {/* right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <DashboardMockup />
            <FloatingElements />
          </motion.div>
        </div>

        {/* trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 md:mt-24 flex flex-col items-center gap-4"
        >
          <p className="text-sm font-medium text-ink-500">As featured in</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustLogos.map((logo) => (
              <span key={logo} className="text-lg font-bold text-ink-400 tracking-tight grayscale hover:grayscale-0 transition-all">
                {logo}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative rounded-2xl bg-white shadow-float border border-ink-200/60 overflow-hidden">
      {/* window bar */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-ink-200/70 bg-ink-50">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-google-red/70" />
          <span className="h-3 w-3 rounded-full bg-google-yellow/80" />
          <span className="h-3 w-3 rounded-full bg-google-green/70" />
        </div>
        <div className="mx-auto h-6 w-40 rounded-md bg-white border border-ink-200 flex items-center justify-center text-[10px] text-ink-400 font-medium">
          app.reviewflow.ai
        </div>
      </div>
      {/* body */}
      <div className="flex">
        {/* mini sidebar */}
        <div className="hidden sm:flex flex-col gap-2 p-3 w-14 border-r border-ink-200/70 bg-ink-50/50">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-google-blue/15' : 'bg-transparent'}`}
            >
              <div className={`h-4 w-4 rounded ${i === 0 ? 'bg-google-blue' : 'bg-ink-300'}`} />
            </div>
          ))}
        </div>
        {/* main */}
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-28 rounded bg-ink-200" />
              <div className="mt-1.5 h-2.5 w-20 rounded bg-ink-100" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-google-blue to-google-green" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Reviews', val: '1,284', color: 'google-blue', delta: '+12%' },
              { label: 'Avg rating', val: '4.8', color: 'google-yellow', delta: '+0.3' },
              { label: 'Response', val: '94%', color: 'google-green', delta: '+8%' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-ink-200/70 p-2.5">
                <div className="text-[9px] font-medium text-ink-500">{s.label}</div>
                <div className="mt-1 text-lg font-extrabold text-ink-800">{s.val}</div>
                <div className={`text-[9px] font-semibold text-${s.color}`}>{s.delta}</div>
              </div>
            ))}
          </div>
          {/* chart */}
          <div className="rounded-xl border border-ink-200/70 p-3">
            <div className="flex items-end gap-1.5 h-20">
              {[40, 55, 35, 70, 50, 85, 65, 90, 75, 95, 80, 100].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
                  className="flex-1 rounded-t bg-gradient-to-t from-google-blue/30 to-google-blue"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingElements() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-5 -left-5 glass-strong rounded-2xl shadow-float border border-white/60 p-3 flex items-center gap-2"
      >
        <div className="h-8 w-8 rounded-full bg-google-yellow/20 flex items-center justify-center">
          <Star className="h-4 w-4 fill-google-yellow text-google-yellow" />
        </div>
        <div>
          <div className="text-xs font-bold text-ink-800">New 5-star review</div>
          <div className="text-[10px] text-ink-500">2 minutes ago</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -right-3 glass-strong rounded-2xl shadow-float border border-white/60 p-3 flex items-center gap-2"
      >
        <div className="h-8 w-8 rounded-full bg-google-green/15 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-google-green" />
        </div>
        <div>
          <div className="text-xs font-bold text-ink-800">+34% this month</div>
          <div className="text-[10px] text-ink-500">Review growth</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-1/3 -right-6 glass-strong rounded-xl shadow-float border border-white/60 p-2.5"
      >
        <Shield className="h-5 w-5 text-google-blue" />
      </motion.div>
    </>
  );
}
