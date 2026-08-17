import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold uppercase tracking-wider text-google-blue"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-ink-800 leading-[1.1] max-w-2xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-ink-600 max-w-xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
