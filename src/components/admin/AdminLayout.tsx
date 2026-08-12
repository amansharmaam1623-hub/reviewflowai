import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Building2, Users, Package, CreditCard, BarChart3, LifeBuoy, LogOut, ArrowLeft,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/admin', label: 'Overview', icon: BarChart3 },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
];

export function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-ink-50/50">
      <aside className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-60 glass-strong rounded-2xl border border-white/60 shadow-card p-4 z-40">
        <div className="px-2 py-2 flex items-center gap-2">
          <Logo compact />
          <span className="text-sm font-bold text-ink-800">Admin Panel</span>
        </div>
        <div className="mt-2 mx-2 px-3 py-2 rounded-lg bg-google-red/10 flex items-center gap-2">
          <Shield className="h-4 w-4 text-google-red" />
          <span className="text-xs font-semibold text-google-red">Administrator</span>
        </div>

        <nav className="mt-4 flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-google-red/12 to-google-red/5 border border-google-red/20"
                    />
                  )}
                  <span className={`relative z-10 h-8 w-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-google-red/15' : 'bg-ink-100'}`}>
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-google-red' : 'text-ink-500'}`} strokeWidth={2} />
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-1">
          <a href="/" className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors">
            <span className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </span>
            Back to Home
          </a>
          <button onClick={async () => { await signOut(); navigate('/', { replace: true }); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:text-google-red hover:bg-google-red/5 transition-colors">
            <span className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center">
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="md:ml-[260px] min-h-screen px-4 md:px-6 py-4 pb-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
