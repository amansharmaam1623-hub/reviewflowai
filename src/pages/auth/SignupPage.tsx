import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';

export function SignupPage() {
  const { signUp, signInWithGoogle, session, profile, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    if (session && profile) {
      if (!emailVerified) {
        navigate('/verify-email', { replace: true });
        return;
      }
      navigate(profile.role === 'admin' ? '/admin' : '/choose-plan', { replace: true });
    }
  }, [session, profile, emailVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setRegisteredEmail(email);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-google-green/15 flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-google-green" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-800 mb-3">Check your email</h1>
          <p className="text-sm text-ink-500 leading-relaxed mb-2">
            We've sent a verification link to
          </p>
          <p className="text-sm font-semibold text-ink-800 mb-6">{registeredEmail}</p>
          <p className="text-sm text-ink-500 leading-relaxed mb-6">
            Please verify your email before signing in. You won't be able to access your account until your email is verified.
          </p>
          <Button className="w-full" onClick={() => navigate('/verify-email')} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Resend verification
          </Button>
          <p className="mt-6 text-center text-sm text-ink-500">
            Already verified? <AuthLink to="/login">Sign in</AuthLink>
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Create your account</h1>
        <p className="text-sm text-ink-500">Start collecting more reviews with ReviewFlow AI</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="James Donovan"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400"
            />
          </div>
        </div>

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
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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

        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400"
            />
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
          Create account
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-ink-200" />
        <span className="text-xs text-ink-400">or</span>
        <div className="flex-1 h-px bg-ink-200" />
      </div>

      <div className="mt-6">
        <GoogleButton onClick={signInWithGoogle} label="Sign up with Google" />
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        By signing up, you agree to our <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link> and <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>.
      </p>

      <p className="mt-4 text-center text-sm text-ink-500">
        Already have an account? <AuthLink to="/login">Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
