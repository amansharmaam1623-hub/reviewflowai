import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  QrCode,
  Building2,
  CreditCard,
  Settings,
  LifeBuoy,
  Home,
  Inbox,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { to: '/dashboard/business', label: 'Business', icon: Building2 },
  { to: '/dashboard/subscription', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { to: '/dashboard/feedback', label: 'Feedback', icon: Inbox },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* floating trigger button */}
      <motion.button
        initial={{ scale: 0, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-6 right-5 z-50 h-14 w-14 rounded-2xl bg-gradient-to-br from-google-blue to-[#1a73e8] shadow-glow-blue flex items-center justify-center"
        aria-label="Open navigation"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          className="flex flex-col gap-1.5"
        >
          <motion.span
            animate={{ width: open ? 20 : 18, rotate: open ? 45 : 0, y: open ? 6 : 0 }}
            className="block h-0.5 bg-white rounded-full"
            style={{ originX: 0 }}
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1, width: open ? 0 : 12 }}
            className="block h-0.5 bg-white rounded-full"
          />
          <motion.span
            animate={{ width: open ? 20 : 16, rotate: open ? -45 : 0, y: open ? -6 : 0 }}
            className="block h-0.5 bg-white rounded-full"
            style={{ originX: 0 }}
          />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 z-[55] bg-ink-800/30 backdrop-blur-md"
            />

            {/* floating bottom sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[56] pb-6 px-4"
            >
              <div className="glass-strong rounded-3xl border border-white/60 shadow-float overflow-hidden">
                {/* grab handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <span className="h-1.5 w-12 rounded-full bg-ink-200" />
                </div>

                {/* header */}
                <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-800">Navigation</span>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-700"
                  >
                    <Home className="h-3.5 w-3.5" />
                    Home
                  </button>
                </div>

                {/* grid nav */}
                <div className="grid grid-cols-4 gap-2 p-3">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={() => setOpen(false)}
                      >
                        {({ isActive }) => (
                          <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${isActive ? 'bg-google-blue/10' : 'hover:bg-ink-100'}`}>
                            <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-google-blue/15' : 'bg-ink-100'}`}>
                              <item.icon className={`h-5 w-5 ${isActive ? 'text-google-blue' : 'text-ink-600'}`} strokeWidth={2} />
                            </span>
                            <span className={`text-[11px] font-medium ${isActive ? 'text-google-blue' : 'text-ink-600'}`}>
                              {item.label}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
