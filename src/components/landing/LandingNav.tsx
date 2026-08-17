import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

const links = [
  { label: 'Features', to: '/features' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/faq' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const dashboardPath = profile?.role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-3"
      >
        <div
          className={`mx-auto max-w-6xl rounded-2xl px-4 md:px-6 h-16 flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'glass-strong shadow-card border border-white/60' : 'bg-transparent'
          }`}
        >
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800 hover:bg-ink-100 rounded-lg transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <Button size="sm" onClick={() => navigate(dashboardPath)}>
                Go to {profile?.role === 'admin' ? 'Admin' : 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Get started
                </Button>
              </>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-ink-700" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 bg-ink-800/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-4 left-4 right-4 glass-strong rounded-2xl shadow-float border border-white/60 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <Logo />
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-ink-100">
                  <X className="h-5 w-5 text-ink-700" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-ink-700 hover:bg-ink-100 rounded-xl transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-ink-200">
                  {session ? (
                    <Button onClick={() => navigate(dashboardPath)}>
                      Go to {profile?.role === 'admin' ? 'Admin' : 'Dashboard'}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => navigate('/login')}>
                        Sign in
                      </Button>
                      <Button onClick={() => navigate('/signup')}>Get started</Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
