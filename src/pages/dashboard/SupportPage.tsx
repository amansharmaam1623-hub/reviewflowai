import { useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, MessageSquare, BookOpen, Mail, ChevronRight, Send, Check } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Button } from '@/components/ui/Button';

const helpArticles = [
  { title: 'Getting started with ReviewFlow', category: 'Onboarding' },
  { title: 'How to generate your first QR code', category: 'QR Codes' },
  { title: 'Understanding review analytics', category: 'Analytics' },
  { title: 'Connecting your Google Business Profile', category: 'Setup' },
  { title: 'Managing multiple locations', category: 'Account' },
  { title: 'Customizing AI review suggestions', category: 'AI Features' },
];

export function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submitMessage = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
    setSubject('');
    setMessage('');
    window.setTimeout(() => setSent(false), 2500);
  };

  return (
    <>
      <Topbar title="Support" subtitle="Get help, browse articles, or contact our team" />
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-br from-google-blue/10 to-google-green/5 border border-google-blue/20 p-6">
          <div className="h-11 w-11 rounded-xl bg-google-blue/15 flex items-center justify-center mb-4"><LifeBuoy className="h-5 w-5 text-google-blue" /></div>
          <h3 className="text-base font-bold text-ink-800 mb-2">Need a hand?</h3>
          <p className="text-sm text-ink-600 leading-relaxed mb-4">Our support team typically responds within 2 hours during business hours.</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-ink-600"><Mail className="h-4 w-4 text-ink-400" /> support@reviewflow.ai</div>
            <div className="flex items-center gap-2.5 text-sm text-ink-600"><MessageSquare className="h-4 w-4 text-ink-400" /> Live chat available 9-6 PT</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/70 shadow-card p-6">
          <h3 className="text-base font-bold text-ink-800 mb-4">Contact Support</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-ink-700 mb-1.5 block">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors" placeholder="Brief description" /></div>
            <div className="flex items-end text-sm text-ink-500">We’ll respond to your account email.</div>
          </div>
          <div className="mt-4"><label className="text-sm font-medium text-ink-700 mb-1.5 block">Message</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors resize-none" placeholder="Describe your issue in detail…" /></div>
          <div className="mt-4"><Button onClick={submitMessage} leftIcon={sent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}>{sent ? 'Message sent!' : 'Send message'}</Button></div>
        </motion.div>
      </div>
      <div className="mt-4 rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4"><BookOpen className="h-4 w-4 text-ink-600" /><h3 className="text-base font-bold text-ink-800">Help Articles</h3></div>
        <div className="grid md:grid-cols-2 gap-2">
          {helpArticles.map((article) => <a key={article.title} href="#" className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors group"><div><div className="text-sm font-medium text-ink-700">{article.title}</div><div className="text-xs text-ink-400">{article.category}</div></div><ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-ink-500 transition-colors shrink-0" /></a>)}
        </div>
      </div>
    </>
  );
}
