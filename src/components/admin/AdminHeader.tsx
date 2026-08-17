import { motion } from 'framer-motion';

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="rounded-2xl glass-strong border border-white/60 shadow-soft px-6 h-16 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink-800">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
        </div>
      </div>
    </motion.header>
  );
}
