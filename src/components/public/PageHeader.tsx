import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-google-blue/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-google-green/10 blur-[100px]"
        />
      </div>
      <div className="mx-auto max-w-4xl px-4 text-center">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold uppercase tracking-wider text-google-blue"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-ink-800 leading-[1.1]"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 text-lg text-ink-600 leading-relaxed max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
