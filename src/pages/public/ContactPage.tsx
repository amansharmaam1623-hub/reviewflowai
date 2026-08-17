import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/lib/usePageMeta';
import { supabase } from '@/lib/supabase';

export function ContactPage() {
  usePageMeta(
    'Contact Us | ReviewFlow AI',
    'Get in touch with the ReviewFlow AI team. Send us a message and we will get back to you as soon as possible.',
  );

  const [form, setForm] = useState({ name: '', email: '', business: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setStatus('error');
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const { error } = await supabase.from('support_tickets').insert({
        subject: `[Contact] ${form.subject}`,
        message: `From: ${form.name} (${form.email})\nBusiness: ${form.business || 'N/A'}\n\n${form.message}`,
        priority: 'normal',
        status: 'open',
      });

      if (error) throw error;

      setStatus('success');
      setForm({ name: '', email: '', business: '', subject: '', message: '' });
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or email us directly.');
    }
  };

  const inputClass = 'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-google-blue focus:ring-2 focus:ring-google-blue/20 focus:outline-none transition-all';

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrow="Contact Us"
        title={<>Get in <span className="gradient-text">touch</span></>}
        subtitle="Have a question, feedback, or need help? Send us a message and we will get back to you as soon as possible."
      />

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-8"
          >
            {status === 'success' ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="h-14 w-14 rounded-2xl bg-google-green/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-7 w-7 text-google-green" />
                </div>
                <h3 className="text-xl font-bold text-ink-800 mb-2">Message sent!</h3>
                <p className="text-sm text-ink-600 mb-6">Thank you for reaching out. We will get back to you shortly.</p>
                <Button variant="outline" onClick={() => setStatus('idle')}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Business name</label>
                  <input
                    type="text"
                    value={form.business}
                    onChange={(e) => setForm({ ...form, business: e.target.value })}
                    className={inputClass}
                    placeholder="Your business (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className={inputClass}
                    placeholder="How can we help?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className={inputClass + ' resize-none'}
                    placeholder="Tell us more..."
                    required
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
                    <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
                    <span className="text-sm text-google-red">{errorMsg}</span>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" loading={status === 'loading'} leftIcon={status === 'loading' ? undefined : <Send className="h-4 w-4" />}>
                  {status === 'loading' ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            )}
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-500">
            <Mail className="h-4 w-4 text-ink-400" />
            <span>Messages are sent to our support team inbox.</span>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
