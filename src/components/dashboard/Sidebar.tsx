import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  QrCode,
  Building2,
  CreditCard,
  Settings,
  LifeBuoy,
  LogOut,
  Shield,
  Inbox,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { to: '/dashboard/business', label: 'Business', icon: Building2 },
  { to: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { to: '/dashboard/feedback', label: 'Feedback Inbox', icon: Inbox },
];

export function Sidebar() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const access = useSubscriptionAccess();

  const planLabel = access.plan ? access.plan.charAt(0).toUpperCase() + access.plan.slice(1) : 'No Plan';
  const planStatus = access.isActive ? 'Active' : access.status === 'pending' ? 'Pending' : access.status === 'past_due' ? 'Past Due' : access.status === 'payment_failed' ? 'Failed' : 'Inactive';
  const statusColor = access.isActive ? 'text-google-green' : access.isPastDue ? 'text-google-red' : 'text-google-blue';

  return (
    <aside className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-60 glass-strong rounded-2xl border border-white/60 shadow-card p-4 z-40">
      <div className="px-2 py-2">
        <Logo />
      </div>

      <nav className="mt-6 flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-ink-800' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-google-blue/12 to-google-blue/5 border border-google-blue/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-google-blue/15' : 'bg-ink-100 group-hover:bg-ink-200'}`}>
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-google-blue' : 'text-ink-500'}`} strokeWidth={2} />
                </span>
                <span className="relative z-10">{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        <div className="rounded-xl bg-ink-50 border border-ink-200/60 px-3 py-2.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-500">Current Plan</span>
            <span className={`text-xs font-semibold capitalize ${statusColor}`}>
              {planStatus}
            </span>
          </div>
          <div className="text-sm font-bold text-ink-800 capitalize mt-0.5">{planLabel}</div>
        </div>
        <NavLink to="/admin" className={profile?.role === 'admin' ? '' : 'pointer-events-none opacity-30'}>
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: 2 }}
              className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:text-ink-700"
            >
              <span className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-ink-500" strokeWidth={2} />
              </span>
              Admin Panel
            </motion.div>
          )}
        </NavLink>
        <button
          onClick={async () => {
            await signOut();
            navigate('/', { replace: true });
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:text-google-red hover:bg-google-red/5 transition-colors"
        >
          <span className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-ink-500" strokeWidth={2} />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
