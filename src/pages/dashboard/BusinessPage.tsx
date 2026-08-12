import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone, Star, QrCode, Check, Tag, Search, Lock, AlertCircle } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBusinesses } from '@/lib/hooks';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

const inputClass = 'w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400';

interface FormState {
  name: string;
  category: string;
  google_business_url: string;
  phone: string;
}

const emptyForm: FormState = {
  name: '', category: '', google_business_url: '', phone: '',
};

export function BusinessPage() {
  const { user } = useAuth();
  const { businesses, loading, refetch } = useBusinesses();
  const access = useSubscriptionAccess();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [keywords, setKeywords] = useState<string[]>(['', '', '', '', '']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const business = businesses[0] ?? null;

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        category: business.category || '',
        google_business_url: business.google_business_url || '',
        phone: business.phone || '',
      });
      const kw = business.seo_keywords ?? [];
      setKeywords([
        kw[0] ?? '', kw[1] ?? '', kw[2] ?? '', kw[3] ?? '', kw[4] ?? '',
      ]);
      setEditingId(business.id);
    }
  }, [business]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    setLimitError(null);
    setError(null);

    if (!form.name.trim()) {
      setError('Business name is required.');
      return;
    }

    // Check business limit before creating a new business (server-side enforcement)
    if (!editingId) {
      const { data: canCreate, error: rpcError } = await supabase.rpc('check_business_limit');
      if (rpcError || !canCreate) {
        const planName = access.plan.charAt(0).toUpperCase() + access.plan.slice(1);
        if (access.plan === 'enterprise') {
          setLimitError(`Your Enterprise plan allows a maximum of 10 businesses.`);
        } else {
          setLimitError(
            `Your ${planName} plan allows ${access.businessLimit} business${access.businessLimit > 1 ? 'es' : ''}. Upgrade to add more.`
          );
        }
        return;
      }
    }

    setSaving(true);
    const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      google_business_url: form.google_business_url.trim() || null,
      phone: form.phone.trim() || null,
      seo_keywords: cleanKeywords,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update(payload)
          .eq('id', editingId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('businesses')
          .insert({ ...payload, user_id: user.id })
          .select('*')
          .single();
        if (insertError) throw insertError;
        if (data) setEditingId(data.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save business details. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Business Profile" subtitle="Manage your business information and Google review settings" />
        <div className="flex items-center justify-center py-20 text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Business Profile" subtitle="Manage your business information and Google review settings" />

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/70 shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="h-5 w-5 text-google-blue" />
            <h3 className="text-base font-bold text-ink-800">Business Information</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field icon={Building2} label="Business Name" placeholder="Bella's Bistro" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field icon={Tag} label="Business Category" placeholder="Italian Restaurant" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field icon={Star} label="Google Review Link" placeholder="google.com/review/…" value={form.google_business_url} onChange={(v) => setForm({ ...form, google_business_url: v })} />
            <Field icon={Phone} label="Phone Number" placeholder="(555) 123-4567" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>

          {/* SEO Keywords Section */}
          <div className="mt-8 pt-6 border-t border-ink-100">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-google-green" />
              <h3 className="text-base font-bold text-ink-800">SEO Keywords</h3>
            </div>
            <p className="text-xs text-ink-500 mb-4">
              Add up to 5 keywords that describe your business. These help the AI review generator create more authentic, relevant reviews.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {keywords.map((kw, i) => (
                <div key={i}>
                  <label className="text-xs font-medium text-ink-500 mb-1.5 block">Keyword {i + 1}</label>
                  <input
                    value={kw}
                    onChange={(e) => setKeywords((prev) => prev.map((k, idx) => (idx === i ? e.target.value : k)))}
                    placeholder={`e.g. ${['best pizza', 'family friendly', 'fresh ingredients', 'quick service', 'cozy ambiance'][i]}`}
                    className="w-full h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-green focus:bg-white transition-colors placeholder:text-ink-400"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={handleSave} loading={saving} leftIcon={saved ? <Check className="h-4 w-4" /> : undefined}>
              {saved ? 'Saved!' : editingId ? 'Save changes' : 'Create business'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
              <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
              <span className="text-sm text-google-red">{error}</span>
            </div>
          )}
          {limitError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
              <Lock className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-google-red">{limitError}</span>
                <button onClick={() => navigate('/dashboard/subscription')} className="ml-2 text-sm font-semibold text-google-blue hover:underline">
                  Upgrade now →
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
            <h3 className="text-sm font-bold text-ink-800 mb-3">Business Card Preview</h3>
            <div className="rounded-xl bg-gradient-to-br from-ink-50 to-white border border-ink-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-800">{form.name || 'Your Business'}</div>
                  <div className="text-xs text-ink-500">{form.category || 'Category'}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-ink-500">
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {form.phone || 'No phone set'}</div>
                <div className="flex items-center gap-1.5"><Star className="h-3 w-3" /> {form.google_business_url ? 'Review link set' : 'No review link'}</div>
              </div>
              {keywords.some((k) => k.trim()) && (
                <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-1.5">
                  {keywords.filter((k) => k.trim()).map((k, i) => (
                    <span key={i} className="text-[10px] font-medium text-google-green bg-google-green/10 px-2 py-0.5 rounded-full">{k.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-google-blue/10 to-google-green/5 border border-google-blue/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-4 w-4 text-google-blue" />
              <h3 className="text-sm font-bold text-ink-800">Generate QR Code</h3>
            </div>
            <p className="text-xs text-ink-600 leading-relaxed mb-4">
              {business
                ? 'Visit the QR Codes page to create custom QR codes linked to your review flow.'
                : 'Save your business info first, then generate QR codes for your review flow.'}
            </p>
            {business && <Button size="sm" className="w-full" leftIcon={<QrCode className="h-4 w-4" />} onClick={() => (window.location.href = '/dashboard/qr')}>Go to QR Generator</Button>}
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge color={business ? 'green' : 'gray'}>{business ? 'Active' : 'Setup needed'}</Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Field({ icon: Icon, label, placeholder, value, onChange }: { icon: React.ElementType; label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input className={inputClass} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
