import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Bell, Shield, Globe, Palette, Check, AlertCircle } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const inputClass = 'w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors placeholder:text-ink-400';

export function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setEmail(profile?.email ?? user?.email ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile, user]);

  const saveProfile = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);

    if (!newPassword) {
      setPwError('Enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      const { data, error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (authError) throw authError;
      if (!data.user) throw new Error('Failed to update password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Manage your account preferences and configuration" />

      <div className="grid lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-3 h-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-google-blue/10 text-google-blue' : 'text-ink-500 hover:bg-ink-100'}`}>
              <t.icon className="h-4 w-4" strokeWidth={2} />
              {t.label}
            </button>
          ))}
        </motion.div>

        <motion.div key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 rounded-2xl bg-white border border-ink-200/70 shadow-card p-6">
          {tab === 'profile' && (
            <div>
              <h3 className="text-base font-bold text-ink-800 mb-5">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center text-white text-xl font-bold">
                  {(fullName || email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change avatar</Button>
                  <p className="mt-1.5 text-xs text-ink-500">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input className={inputClass} value={email} disabled />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block">Timezone</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <select className={inputClass + ' appearance-none'}>
                      <option>Pacific Time (PT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={saveProfile} loading={saving} leftIcon={saved ? <Check className="h-4 w-4" /> : undefined}>
                  {saved ? 'Saved!' : 'Save changes'}
                </Button>
              </div>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
                  <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
                  <span className="text-sm text-google-red">{error}</span>
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 className="text-base font-bold text-ink-800 mb-5">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { title: 'New review alerts', desc: 'Get notified when a new review is posted' },
                  { title: 'Weekly digest', desc: 'Summary of your review performance every Monday' },
                  { title: 'Negative review alerts', desc: 'Instant alert for reviews under 3 stars' },
                  { title: 'Product updates', desc: 'News about new features and improvements' },
                ].map((n, i) => (
                  <ToggleRow key={i} title={n.title} desc={n.desc} defaultOn={i < 3} />
                ))}
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 className="text-base font-bold text-ink-800 mb-5">Security</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block">Current Password</label>
                  <input
                    type="password"
                    className={inputClass.replace('pl-10', 'pl-4')}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-ink-700 mb-1.5 block">New Password</label>
                    <input
                      type="password"
                      className={inputClass.replace('pl-10', 'pl-4')}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-700 mb-1.5 block">Confirm Password</label>
                    <input
                      type="password"
                      className={inputClass.replace('pl-10', 'pl-4')}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <ToggleRow title="Two-factor authentication" desc="Add an extra layer of security to your account" defaultOn={false} />
                <Button onClick={updatePassword} loading={pwSaving} leftIcon={pwSaved ? <Check className="h-4 w-4" /> : undefined}>
                  {pwSaved ? 'Password updated!' : 'Update password'}
                </Button>
                {pwError && (
                  <div className="flex items-start gap-2 rounded-xl bg-google-red/5 border border-google-red/20 p-3">
                    <AlertCircle className="h-4 w-4 text-google-red shrink-0 mt-0.5" />
                    <span className="text-sm text-google-red">{pwError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div>
              <h3 className="text-base font-bold text-ink-800 mb-5">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Light', 'System', 'Dark (soon)'].map((t, i) => (
                      <button key={t} className={`rounded-xl border-2 p-4 text-sm font-medium transition-colors ${i === 0 ? 'border-google-blue bg-google-blue/5 text-google-blue' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <ToggleRow title="Reduce motion" desc="Minimize animations across the app" defaultOn={false} />
                <ToggleRow title="Compact mode" desc="Reduce spacing for denser information display" defaultOn={false} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

function ToggleRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-ink-50">
      <div>
        <div className="text-sm font-medium text-ink-700">{title}</div>
        <div className="text-xs text-ink-500">{desc}</div>
      </div>
      <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${on ? 'bg-google-blue' : 'bg-ink-200'}`}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
