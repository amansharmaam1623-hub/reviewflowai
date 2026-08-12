import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-google-green/15 flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-google-green" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-800 mb-3">Check your email</h1>
          <p className="text-sm text-ink-500 leading-relaxed mb-6">
            We've sent a password reset link to <span className="font-semibold text-ink-700">{email}</span>.
            Follow the link in the email to reset your password.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to sign in
            </Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Forgot password?</h1>
        <p className="text-sm text-ink-500">Enter your email and we'll send you a reset link</p>
      </div>

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

        <Button type="submit" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Remember your password? <AuthLink to="/login">Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
