import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Star, QrCode, BarChart3, Sparkles } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left: form */}
      <div className="flex flex-col px-6 py-8 md:px-12 lg:px-16">
        <Logo />
        <div className="flex-1 flex items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
        <p className="text-center text-xs text-ink-400">
          © 2026 ReviewFlow AI. All rights reserved.
        </p>
      </div>

      {/* right: visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-ink-800 via-[#1a2332] to-[#0d1521] items-center justify-center p-12">
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-google-blue/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-google-green/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-google-yellow/10 blur-[100px]" />

        <div className="relative z-10 max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold text-white leading-tight mb-6"
          >
            Turn happy customers into five-star reviews
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 leading-relaxed mb-10"
          >
            AI-powered review generation, smart QR codes, and real-time analytics — all in one elegant dashboard.
          </motion.p>

          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'AI generates review drafts in seconds', color: 'google-blue' },
              { icon: QrCode, text: 'Branded QR codes that link to your review flow', color: 'google-green' },
              { icon: BarChart3, text: 'Real-time analytics and sentiment tracking', color: 'google-yellow' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <f.icon className={`h-5 w-5 text-${f.color}`} />
                </div>
                <span className="text-sm text-white/80 font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {['#4285F4', '#34A853', '#FBBC05', '#EA4335'].map((c, i) => (
                <div key={i} className="h-9 w-9 rounded-full ring-2 ring-[#0d1521] flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                  {['JD', 'SM', 'AK', 'RP'][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-google-yellow text-google-yellow" />
              ))}
            </div>
            <span className="text-sm text-white/60">2,000+ businesses</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-google-blue hover:underline">
      {children}
    </Link>
  );
}
