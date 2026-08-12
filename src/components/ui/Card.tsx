import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  hover?: 'lift' | 'none';
  variant?: 'default' | 'gradient' | 'glass';
}

export function Card({ hover = 'lift', variant = 'default', className = '', children, ...props }: CardProps) {
  const base =
    variant === 'gradient'
      ? 'gradient-border bg-white'
      : variant === 'glass'
        ? 'glass border border-white/60'
        : 'bg-white border border-ink-200/70';
  return (
    <motion.div
      whileHover={hover === 'lift' ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative rounded-2xl shadow-card ${base} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
