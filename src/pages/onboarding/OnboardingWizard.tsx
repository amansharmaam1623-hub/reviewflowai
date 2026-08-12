import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, Building2, Phone, Globe, ExternalLink,
  Check, ArrowRight, ArrowLeft, Loader2, QrCode, Download, Copy,
  Share2, Printer, Sparkles, AlertCircle, X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RealQRCode, downloadQrPng, downloadQrSvg } from '@/components/ui/RealQRCode';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { getBusinessLimit } from '@/lib/plans';
import { supabase } from '@/lib/supabase';

interface BusinessSuggestion {
  placeId: string;
  name: string;
  address: string;
  fullDescription: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  reviewUrl: string;
  category: string;
  rating: number | null;
  ratingCount: number | null;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Find your business', 'Confirm details', 'Create review funnel', 'You\'re all set'];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, profile, completeOnboarding, loading: authLoading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  const { show: showToast } = useToast();

  // Block onboarding without active subscription
  useEffect(() => {
    if (authLoading || access.loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!emailVerified) {
      navigate('/verify-email', { replace: true });
      return;
    }
    if (!access.isActive) {
      navigate('/choose-plan', { replace: true });
      return;
    }
    if (profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [authLoading, access.loading, user, emailVerified, access.isActive, profile, navigate]);

  const businessLimit = getBusinessLimit(profile ? (access.plan) : 'starter');

  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<BusinessSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<BusinessSuggestion | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizMapsUrl, setBizMapsUrl] = useState('');
  const [bizReviewUrl, setBizReviewUrl] = useState('');

  const [creating, setCreating] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [createdQrId, setCreatedQrId] = useState<string | null>(null);
  const [reviewUrl, setReviewUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSearchedRef = useRef(false);

  // Redirect if already onboarded or not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (profile?.onboarding_completed) {
      navigate(profile.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    setSearchError(null);
    hasSearchedRef.current = true;
    searchTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('google-places', {
          body: { action: 'autocomplete', input: search },
        });
        if (error) {
          setSuggestions([]);
          setSearchError((error as Error).message || 'Search failed. Please try again.');
        } else if (data?.error) {
          setSuggestions([]);
          setSearchError(data.error);
        } else if (!data?.suggestions) {
          setSuggestions([]);
          setSearchError('Unexpected response from the server.');
        } else {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        setSuggestions([]);
        setSearchError(err instanceof Error ? err.message : 'Network error. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const skipBusinessSearch = () => {
    // Skip Google Places entirely — user can add details later from the Dashboard.
    setSelectedPlace(null);
    setDetails(null);
    setBizName('');
    setBizCategory('');
    setBizAddress('');
    setBizPhone('');
    setBizWebsite('');
    setBizMapsUrl('');
    setBizReviewUrl('');
    setFetchingDetails(false);
    setStep(2);
  };

  const selectBusiness = async (suggestion: BusinessSuggestion) => {
    setSelectedPlace(suggestion);
    setFetchingDetails(true);
    setStep(2);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'details', placeId: suggestion.placeId },
      });
      if (error) throw new Error((error as Error).message || 'Failed to fetch business details.');
      if (data?.error) throw new Error(data.error);
      if (!data) throw new Error('No data returned from the server.');
      const d = data as PlaceDetails;
      setDetails(d);
      setBizName(d.name || suggestion.name);
      setBizCategory(d.category || '');
      setBizAddress(d.address || suggestion.address);
      setBizPhone(d.phone || '');
      setBizWebsite(d.website || '');
      setBizMapsUrl(d.mapsUrl || '');
      setBizReviewUrl(d.reviewUrl || '');
    } catch {
      // Fallback to suggestion data
      setBizName(suggestion.name);
      setBizAddress(suggestion.address);
      setBizReviewUrl(`https://search.google.com/local/writereview?placeid=${suggestion.placeId}`);
    } finally {
      setFetchingDetails(false);
    }
  };

  const createFunnel = async () => {
    if (!user) return;
    setCreating(true);
    try {
      // Enforce business limit before creating
      const { count } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (count !== null && count >= businessLimit) {
        showToast(`You've reached the ${businessLimit}-business limit on your ${access.plan} plan.`, 'error');
        setCreating(false);
        return;
      }

      // Store NULL (not empty strings) for any Google fields the user left blank.
      const nullIfEmpty = (v: string) => (v && v.trim() ? v.trim() : null);

      // Step 1: Create business
      const { data: bizData, error: bizError } = await supabase.from('businesses').insert({
        user_id: user.id,
        name: bizName.trim(),
        category: nullIfEmpty(bizCategory),
        address: nullIfEmpty(bizAddress),
        phone: nullIfEmpty(bizPhone),
        website: nullIfEmpty(bizWebsite),
        google_business_url: nullIfEmpty(bizMapsUrl),
        google_place_id: selectedPlace?.placeId ?? null,
      }).select('*').single();

      if (bizError) throw bizError;
      setCreatedBusinessId(bizData.id);

      // QR target_url fallback:
      //   1. Google Review URL (if present)
      //   2. Google Maps URL (if present)
      //   3. Dashboard settings page so the user can update the review link later
      const reviewLink = nullIfEmpty(bizReviewUrl);
      const mapsLink = nullIfEmpty(bizMapsUrl);
      const targetUrl = reviewLink
        ?? mapsLink
        ?? `/dashboard/business/${bizData.id}/settings`;

      // Step 2: Create QR code
      const { data: qrData, error: qrError } = await supabase.from('qr_codes').insert({
        business_id: bizData.id,
        user_id: user.id,
        identifier: `${bizData.id}-main`,
        target_url: targetUrl,
        scan_count: 0,
        is_active: true,
      }).select('*').single();

      if (qrError) throw qrError;
      setCreatedQrId(qrData.id);
      setReviewUrl(`${window.location.origin}/review/${qrData.id}`);
      setStep(4);
    } catch (err) {
      console.error('Onboarding creation error:', err);
      showToast('Failed to create your review funnel. Please try again.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(reviewUrl);
    setCopied(true);
    showToast('Review link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${bizName} Review`, url: reviewUrl });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  const printQr = () => {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code - ${bizName}</title></head>
      <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;">
        <div style="text-align:center;padding:40px;">
          <h1 style="font-size:24px;margin-bottom:8px;">${bizName}</h1>
          <p style="color:#666;margin-bottom:24px;">Scan to leave us a review</p>
          <img src="${qrDataUrl}" style="width:300px;height:300px;" />
        </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const downloadJpg = async () => {
    if (!createdQrId) return;
    const qrVal = `${window.location.origin}/review/${createdQrId}`;
    // Generate QR to canvas, then convert to JPG
    const QRCode = (await import('qrcode')).default;
    QRCode.toCanvas(qrVal, { width: 512, margin: 2, color: { dark: '#4285F4', light: '#FFFFFF' } }, (err: any, canvas: HTMLCanvasElement) => {
      if (err) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bizName}-qr.jpg`.replace(/\s+/g, '-').toLowerCase();
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    });
    setDownloadCount((c) => c + 1);
    showToast('JPG downloaded');
  };

  const downloadPdf = async () => {
    if (!createdQrId) return;
    const qrVal = `${window.location.origin}/review/${createdQrId}`;
    const QRCode = (await import('qrcode')).default;
    QRCode.toDataURL(qrVal, { width: 512, margin: 2, color: { dark: '#4285F4', light: '#FFFFFF' } }, (err: any, dataUrl: string) => {
      if (err) return;
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) return;
      win.document.write(`
        <html><head><title>QR Code - ${bizName}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;">
          <div style="text-align:center;padding:40px;">
            <h1 style="font-size:28px;margin-bottom:8px;">${bizName}</h1>
            <p style="color:#666;margin-bottom:24px;font-size:16px;">Scan to leave us a review</p>
            <img src="${dataUrl}" style="width:350px;height:350px;" />
            <p style="margin-top:24px;color:#999;font-size:12px;">Powered by ReviewFlow AI</p>
          </div>
        </body></html>
      `);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 500);
    });
    setDownloadCount((c) => c + 1);
    showToast('PDF ready to save');
  };

  const handleDownloadPng = () => {
    if (!createdQrId) return;
    const qrVal = `${window.location.origin}/review/${createdQrId}`;
    downloadQrPng(qrVal, '#4285F4', `${bizName}-qr.png`.replace(/\s+/g, '-').toLowerCase());
    setDownloadCount((c) => c + 1);
    showToast('PNG downloaded');
  };

  const handleDownloadSvg = () => {
    if (!createdQrId) return;
    const qrVal = `${window.location.origin}/review/${createdQrId}`;
    downloadQrSvg(qrVal, '#4285F4', `${bizName}-qr.svg`.replace(/\s+/g, '-').toLowerCase());
    setDownloadCount((c) => c + 1);
    showToast('SVG downloaded');
  };

  const goToDashboard = async () => {
    await completeOnboarding();
    navigate('/dashboard', { replace: true });
  };

  const qrDataUrl = createdQrId ? `${window.location.origin}/review/${createdQrId}` : '';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-google-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400 hidden sm:inline">Step</span>
          <span className="text-sm font-bold text-ink-800">{step}</span>
          <span className="text-sm text-ink-400">of 4</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-ink-100">
        <motion.div
          className="h-full bg-gradient-to-r from-google-blue to-google-green"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Step labels */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-ink-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isDone = step > stepNum;
            const isActive = step === stepNum;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone ? 'bg-google-green text-white' : isActive ? 'bg-google-blue text-white' : 'bg-ink-100 text-ink-400'
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : stepNum}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${isActive || isDone ? 'text-ink-700' : 'text-ink-400'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${isDone ? 'bg-google-green' : 'bg-ink-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Search Business ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center shadow-glow-blue mb-5">
                    <Search className="h-8 w-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Find your business</h1>
                  <p className="text-sm text-ink-500">Search Google's database of businesses to get started</p>
                </div>

                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${searching ? 'text-google-blue' : 'text-ink-400'}`} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your business name…"
                    autoFocus
                    className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white border-2 border-ink-200 text-base text-ink-800 outline-none focus:border-google-blue transition-colors shadow-card"
                  />
                  {searching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-google-blue animate-spin" />
                  )}
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  {search.length < 2 && !hasSearchedRef.current && (
                    <div className="text-center py-8">
                      <MapPin className="h-8 w-8 text-ink-300 mx-auto mb-3" />
                      <p className="text-sm text-ink-400">Start typing to see business suggestions</p>
                    </div>
                  )}

                  {search.length >= 2 && !searching && suggestions.length === 0 && !searchError && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-ink-300 mx-auto mb-3" />
                      <p className="text-sm text-ink-400">No businesses found. Try a different search.</p>
                    </div>
                  )}

                  {searchError && !searching && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-google-red mx-auto mb-3" />
                      <p className="text-sm text-google-red font-medium">{searchError}</p>
                      <p className="text-xs text-ink-400 mt-1">Check that the Google Places API is enabled and the API key is configured.</p>
                    </div>
                  )}

                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s.placeId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2 }}
                      onClick={() => selectBusiness(s)}
                      className="w-full text-left rounded-xl bg-white border border-ink-200 hover:border-google-blue hover:shadow-card p-4 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-google-blue/10 flex items-center justify-center shrink-0 group-hover:bg-google-blue/20 transition-colors">
                          <Building2 className="h-5 w-5 text-google-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-800 truncate">{s.name}</p>
                          <p className="text-xs text-ink-500 truncate">{s.address}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-google-blue transition-colors shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Skip for Now — optional Google Business search */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={skipBusinessSearch}
                    className="w-full h-12 rounded-2xl bg-white border border-ink-200 text-sm font-semibold text-ink-500 hover:text-ink-700 hover:border-ink-300 hover:bg-ink-50 transition-all"
                  >
                    Skip for Now
                  </button>
                  <p className="text-center text-xs text-ink-400 mt-2">
                    You can add your Google Business details later from your Dashboard.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Confirm Details ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Confirm your details</h1>
                  <p className="text-sm text-ink-500">We've pre-filled your business info — edit anything before saving</p>
                </div>

                {fetchingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-google-blue animate-spin mb-4" />
                    <p className="text-sm text-ink-500">Fetching business details from Google…</p>
                  </div>
                ) : (
                  <>
                    {/* Google rating badge */}
                    {details?.rating && (
                      <div className="flex items-center justify-center gap-3 rounded-xl bg-white border border-ink-200/70 shadow-card p-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < Math.round(details.rating!) ? 'fill-google-yellow text-google-yellow' : 'text-ink-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-ink-800">{details.rating.toFixed(1)}</span>
                        <span className="text-sm text-ink-500">· {(details.ratingCount ?? 0).toLocaleString()} reviews on Google</span>
                      </div>
                    )}

                    <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 space-y-4">
                      <DetailField icon={<Building2 className="h-4 w-4" />} label="Business Name" value={bizName} onChange={setBizName} />
                      <DetailField icon={<Sparkles className="h-4 w-4" />} label="Category" value={bizCategory} onChange={setBizCategory} />
                      <DetailField icon={<MapPin className="h-4 w-4" />} label="Address" value={bizAddress} onChange={setBizAddress} />
                      <DetailField icon={<Phone className="h-4 w-4" />} label="Phone" value={bizPhone} onChange={setBizPhone} />
                      <DetailField icon={<Globe className="h-4 w-4" />} label="Website" value={bizWebsite} onChange={setBizWebsite} />
                      <DetailField icon={<MapPin className="h-4 w-4" />} label="Google Maps URL" value={bizMapsUrl} onChange={setBizMapsUrl} />
                      <DetailField icon={<Star className="h-4 w-4" />} label="Google Review URL" value={bizReviewUrl} onChange={setBizReviewUrl} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => { setStep(1); setSelectedPlace(null); }} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                        Back
                      </Button>
                      <Button className="flex-1" onClick={() => setStep(3)} rightIcon={<ArrowRight className="h-4 w-4" />} disabled={!bizName}>
                        Continue
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Create Review Funnel ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center shadow-glow-blue mb-5">
                    <QrCode className="h-8 w-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-extrabold text-ink-800 mb-2">Create your review funnel</h1>
                  <p className="text-sm text-ink-500">We'll generate your QR code and review link automatically</p>
                </div>

                <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 space-y-4">
                  {[
                    { icon: Building2, label: 'Save business profile', desc: bizName },
                    { icon: QrCode, label: 'Generate unique QR code', desc: 'Branded with your business colors' },
                    { icon: ExternalLink, label: 'Create review link', desc: 'Short URL for sharing' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-google-blue/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-google-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800">{item.label}</p>
                        <p className="text-xs text-ink-500 truncate">{item.desc}</p>
                      </div>
                      <Check className="h-5 w-5 text-google-green shrink-0" />
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={createFunnel} loading={creating} leftIcon={!creating ? <Sparkles className="h-4 w-4" /> : undefined}>
                    {creating ? 'Creating…' : 'Create my funnel'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Success Screen ── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="mx-auto h-16 w-16 rounded-full bg-google-green/15 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-google-green" strokeWidth={3} />
                  </motion.div>
                  <h1 className="text-2xl font-extrabold text-ink-800 mb-2">You're all set!</h1>
                  <p className="text-sm text-ink-500">Your review funnel is ready to collect more 5-star reviews</p>
                </div>

                {/* Premium QR Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-3xl bg-white border-2 border-ink-200/70 shadow-float overflow-hidden"
                >
                  {/* Card header with gradient */}
                  <div className="bg-gradient-to-r from-google-blue to-google-green px-6 py-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{bizName}</h3>
                      <p className="text-xs text-white/80">{bizCategory || 'Business'}</p>
                    </div>
                  </div>

                  {/* QR display */}
                  <div className="flex items-center justify-center p-6 sm:p-8 bg-ink-50/30">
                    <div className="rounded-2xl p-3 bg-white border-2 border-google-blue shadow-card">
                      {createdQrId && (
                        <RealQRCode value={qrDataUrl} color="#4285F4" size={220} className="w-[180px] sm:w-[220px]" />
                      )}
                    </div>
                  </div>

                  {/* Review link */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center gap-2 rounded-xl bg-ink-50 border border-ink-200/60 p-3">
                      <span className="text-xs text-ink-600 truncate font-mono flex-1" title={reviewUrl}>{reviewUrl.replace(window.location.origin, '')}</span>
                      <button onClick={copyLink} className="shrink-0 h-8 w-8 rounded-lg bg-white flex items-center justify-center hover:bg-ink-100 transition-colors">
                        {copied ? <Check className="h-4 w-4 text-google-green" /> : <Copy className="h-4 w-4 text-ink-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Download buttons */}
                  <div className="px-6 pb-6 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownloadPng} className="w-full">PNG</Button>
                      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={downloadJpg} className="w-full">JPG</Button>
                      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={downloadPdf} className="w-full">PDF</Button>
                      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownloadSvg} className="w-full">SVG</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="ghost" size="sm" leftIcon={<Share2 className="h-4 w-4" />} onClick={shareLink} className="w-full">Share</Button>
                      <Button variant="ghost" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={printQr} className="w-full">Print</Button>
                      <Button variant="ghost" size="sm" leftIcon={copied ? <Check className="h-4 w-4 text-google-green" /> : <Copy className="h-4 w-4" />} onClick={copyLink} className="w-full">{copied ? 'Copied' : 'Copy'}</Button>
                    </div>
                  </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white border border-ink-200/70 p-3 text-center">
                    <p className="text-lg font-extrabold text-ink-800">1</p>
                    <p className="text-[11px] text-ink-500 uppercase tracking-wide">QR Code</p>
                  </div>
                  <div className="rounded-xl bg-white border border-ink-200/70 p-3 text-center">
                    <p className="text-lg font-extrabold text-ink-800">{downloadCount}</p>
                    <p className="text-[11px] text-ink-500 uppercase tracking-wide">Downloads</p>
                  </div>
                  <div className="rounded-xl bg-white border border-ink-200/70 p-3 text-center">
                    <Badge color="green">Active</Badge>
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={goToDashboard} rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Continue to Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-ink-400">
        Powered by <span className="font-semibold text-ink-600">ReviewFlow AI</span>
      </footer>
    </div>
  );
}

function DetailField({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-400">{icon}</span>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue focus:bg-white transition-colors"
      />
    </div>
  );
}
