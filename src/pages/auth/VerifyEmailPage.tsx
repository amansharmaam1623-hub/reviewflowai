import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';

export function VerifyEmailPage() {
  const { resendVerification, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email ?? '');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email address.');
      return;
    }
    setResending(true);
    setError(null);
    const { error } = await resendVerification(email);
    setResending(false);
    if (error) {
      setError(error);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-google-blue/15 flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-google-blue" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink-800 mb-3">Check your email</h1>
        <p className="text-sm text-ink-500 leading-relaxed mb-6">
          We've sent a verification link to your email address. Please verify your email before continuing.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-google-red/5 border border-google-red/20 px-4 py-3 text-sm text-google-red text-left">
            {error}
          </div>
        )}

        {resent && (
          <div className="mb-4 rounded-xl bg-google-green/5 border border-google-green/20 px-4 py-3 text-sm text-google-green text-left">
            Verification email sent. Check your inbox.
          </div>
        )}

        <div className="space-y-3">
          <Button className="w-full" onClick={handleResend} loading={resending} leftIcon={!resending ? <RefreshCw className="h-4 w-4" /> : undefined}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>

          <div>
            <label className="text-xs font-medium text-ink-500 mb-1.5 block text-left">Change email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400"
              />
              <Button variant="outline" size="sm" onClick={handleResend} loading={resending}>
                Send
              </Button>
            </div>
          </div>

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-800 transition-colors pt-2">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Already verified? <AuthLink to="/login">Sign in</AuthLink>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
