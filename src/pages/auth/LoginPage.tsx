import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const { signIn, signInWithGoogle, session, profile, loading: authLoading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from;

  useEffect(() => {
    if (authLoading || access.loading) return;
    if (!session || !profile) return;

    if (!emailVerified) {
      navigate('/verify-email', { replace: true });
      return;
    }

    if (profile.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    if (!access.isActive) {
      navigate('/choose-plan', { replace: true });
      return;
    }

    if (!profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [session, profile, authLoading, access.loading, access.isActive, emailVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Welcome back</h1>
        <p className="text-sm text-ink-500">Sign in to your account to continue</p>
      </div>

      {from && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-google-blue/5 border border-google-blue/20 px-4 py-3 text-sm text-google-blue">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Please sign in to access that page.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-ink-700">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-google-blue hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl bg-google-red/5 border border-google-red/20 px-4 py-3 text-sm text-google-red"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <Button type="submit" className="w-full" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-ink-200" />
        <span className="text-xs text-ink-400">or</span>
        <div className="flex-1 h-px bg-ink-200" />
      </div>

      <div className="mt-6">
        <GoogleButton onClick={signInWithGoogle} label="Continue with Google" />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don't have an account? <AuthLink to="/signup">Sign up free</AuthLink>
      </p>
    </AuthLayout>
  );
}
