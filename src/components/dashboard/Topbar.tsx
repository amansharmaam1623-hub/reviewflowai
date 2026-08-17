import { motion } from 'framer-motion';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { profile } = useAuth();
  const initials = (profile?.full_name || profile?.email || 'U').slice(0, 2).toUpperCase();
  const planLabel = profile?.role === 'admin' ? 'Admin' : 'Pro plan';

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 -mx-4 md:mx-0 mb-6"
    >
      <div className="md:rounded-2xl glass-strong border border-white/60 shadow-soft px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink-800 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl bg-ink-100 border border-ink-200/70 w-56">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              placeholder="Search…"
              className="bg-transparent text-sm text-ink-700 placeholder:text-ink-400 outline-none w-full"
            />
            <kbd className="text-[10px] font-medium text-ink-400 bg-white px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>

          <button className="relative h-10 w-10 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition-colors">
            <Bell className="h-5 w-5 text-ink-600" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-google-red ring-2 ring-white" />
          </button>

          <button className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-xl hover:bg-ink-100 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-ink-800">{profile?.full_name || 'User'}</div>
              <div className="text-[10px] text-ink-500">{planLabel}</div>
            </div>
            <ChevronDown className="hidden sm:block h-4 w-4 text-ink-400" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
