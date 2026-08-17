import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  color: 'google-blue' | 'google-green' | 'google-yellow' | 'google-red';
  delay?: number;
}

const colorMap = {
  'google-blue': { bg: 'bg-google-blue/10', text: 'text-google-blue' },
  'google-green': { bg: 'bg-google-green/10', text: 'text-google-green' },
  'google-yellow': { bg: 'bg-google-yellow/20', text: 'text-[#a86e00]' },
  'google-red': { bg: 'bg-google-red/10', text: 'text-google-red' },
};

export function StatCard({ icon: Icon, label, value, delta, trend = 'up', color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl bg-white border border-ink-200/70 p-5 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c.bg} transition-transform group-hover:scale-110`}>
          <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={2} />
        </div>
        {delta && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-google-green' : 'text-google-red'}`}>
            {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-extrabold text-ink-800">{value}</div>
        <div className="mt-1 text-sm text-ink-500">{label}</div>
      </div>
    </motion.div>
  );
}
