import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import type { UserRole } from '@/lib/supabase';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative h-14 w-14">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-3 border-ink-200 border-t-google-blue"
            style={{ borderWidth: '3px' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-google-blue" fill="currentColor">
              <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
            </svg>
          </div>
        </div>
        <span className="text-sm font-medium text-ink-500">Loading…</span>
      </motion.div>
    </div>
  );
}

interface ProtectedRouteProps {
  allowedRole: UserRole;
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { session, profile, loading: authLoading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  const location = useLocation();

  if (authLoading || access.loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <LoadingSpinner />;

  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  // For business users, require an active subscription to access dashboard
  if (allowedRole === 'business') {
    if (!access.isActive) {
      return <Navigate to="/choose-plan" replace />;
    }
    if (!profile.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <Outlet />;
}
