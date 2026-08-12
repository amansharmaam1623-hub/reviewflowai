import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Check, ArrowRight, Sparkles, Building2, Loader2,
  RefreshCw, ExternalLink, Copy, Pencil, Send, Heart,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { supabase, type Business, type QrCode } from '@/lib/supabase';

interface ReviewSuggestion {
  text: string;
  sentiment: string;
}

type Step = 'loading' | 'rating' | 'reviews' | 'thankyou' | 'notfound';
type Tone = 'friendly' | 'professional' | 'casual' | 'emotional' | 'premium' | 'luxury';
type ReviewLength = 'short' | 'medium' | 'long';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' },
];

const LENGTHS: { value: ReviewLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const INDIAN_STATES = [
  "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
  "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand",
  "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur",
  "meghalaya", "mizoram", "nagaland", "odisha", "orissa", "punjab",
  "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura",
  "uttar pradesh", "uttarakhand", "west bengal", "delhi", "chandigarh",
  "puducherry", "lakshadweep", "daman and diu", "dadra and nagar haveli",
  "andaman and nicobar", "jammu and kashmir", "ladakh",
];

function extractLocation(address: string): string {
  if (!address) return '';
  let loc = address.trim();
  // Remove PIN/postal codes
  loc = loc.replace(/\b\d{6}\b/g, '');
  loc = loc.replace(/\b\d{5}(?:-\d{4})?\b/g, '');
  loc = loc.replace(/pin\s*code\s*:?\s*\d*/gi, '');
  loc = loc.replace(/pin\s*:?\s*\d*/gi, '');
  loc = loc.replace(/postal\s*code\s*:?\s*\d*/gi, '');
  // Split by comma, filter out state names
  const parts = loc.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
  const filtered = parts.filter((p) => {
    const lower = p.toLowerCase().trim();
    return !INDIAN_STATES.includes(lower);
  });
  // Strip state names within parts
  const cleanedParts = filtered.map((p) => {
    let cleaned = p;
    for (const state of INDIAN_STATES) {
      const re = new RegExp(`\\b${state}\\b`, 'gi');
      cleaned = cleaned.replace(re, '').trim();
    }
    return cleaned.replace(/,\s*$/, '').trim();
  }).filter((p) => p.length > 0);
  return cleanedParts.join(', ').replace(/,\s*,/g, ',').replace(/,\s*$/g, '').trim();
}

export function ReviewFlow() {
  const { id } = useParams<{ id: string }>();
  const { show: showToast } = useToast();
  const [step, setStep] = useState<Step>('loading');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [qrCode, setQrCode] = useState<QrCode | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tone, setTone] = useState<Tone>('friendly');
  const [reviewLength, setReviewLength] = useState<ReviewLength>('medium');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastReviewsRef = useRef<string[]>([]);

  const generateReviews = useCallback(async (biz: Business, rt: number, tn: Tone, ln: ReviewLength) => {
    setGenerating(true);
    setSelectedIndex(null);
    setReviewText('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-reviews', {
        body: {
          businessId: biz.id,
          businessName: biz.name || 'this business',
          category: biz.category || '',
          primaryService: biz.category || '',
          location: extractLocation(biz.address || ''),
          keywords: biz.seo_keywords ?? [],
          reviewUrl: biz.google_review_link || '',
          rating: rt,
          tone: tn,
          length: ln,
          excludeTexts: lastReviewsRef.current,
        },
      });

      if (error || !data?.reviews) {
        if (data?.limitReached) {
          setSuggestions([{ text: data.error || 'Review limit reached for this billing period.', sentiment: 'Error' }]);
          return;
        }
        throw new Error('Edge function failed');
      }

      const newReviews = data.reviews as ReviewSuggestion[];
      lastReviewsRef.current = newReviews.map((r) => r.text.slice(0, 60).toLowerCase());
      setSuggestions(newReviews);
    } catch {
      setSuggestions([{ text: 'We couldn\'t generate review suggestions right now. Please try again.', sentiment: 'Error' }]);
      lastReviewsRef.current = [];
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setStep('notfound');
      return;
    }
    (async () => {
      const { data: qr } = await supabase.from('qr_codes').select('*').eq('id', id).maybeSingle();
      if (!qr) {
        setStep('notfound');
        return;
      }
      setQrCode(qr as QrCode);
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', (qr as QrCode).business_id).maybeSingle();
      if (!biz) {
        setStep('notfound');
        return;
      }
      setBusiness(biz as Business);
      const url = (qr as QrCode).target_url || (biz as Business).google_review_link || '';
      setTargetUrl(url);
      setStep('rating');

      // Record the scan (atomic increment via RPC)
      await supabase.rpc('increment_qr_scan', { qr_id: qr.id });
    })();
  }, [id]);

  const handleContinue = async () => {
    if (!business || rating === 0) return;
    // All ratings (1-5): go to AI review generator
    setStep('reviews');
    await generateReviews(business, rating, tone, reviewLength);
  };

  const submitFeedback = async () => {
    if (!business || selectedIndex === null || !suggestions[selectedIndex]) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        business_id: business.id,
        rating,
        generated_review: reviewText || suggestions[selectedIndex].text,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        sentiment: 'negative',
        review_source: 'qr_code',
        status: 'pending',
      });
      if (error) throw error;
      setStep('thankyou');
    } catch {
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSuggestions = async () => {
    if (!business) return;
    await generateReviews(business, rating, tone, reviewLength);
  };

  const selectReview = (i: number) => {
    setSelectedIndex(i);
    setReviewText(suggestions[i].text);
  };

  const copyAndOpenGoogle = async () => {
    if (selectedIndex === null || !suggestions[selectedIndex]) return;
    setActionLoading(true);
    try {
      await navigator.clipboard.writeText(reviewText || suggestions[selectedIndex].text);

      // Record the review in the reviews table
      if (business) {
        await supabase.from('reviews').insert({
          business_id: business.id,
          author_name: customerName.trim() || 'Anonymous',
          rating,
          text: reviewText || suggestions[selectedIndex].text,
          status: 'published',
          review_source: 'qr_code',
        });
      }

      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      showToast('Review copied successfully. Simply paste it into Google Reviews.');
    } catch {
      showToast('Failed to copy. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading state ──
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-google-blue animate-spin mb-4" />
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    );
  }

  // ── Not found ──
  if (step === 'notfound' || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex flex-col">
        <header className="px-4 py-4 flex items-center justify-between">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-ink-400" />
            </div>
            <h1 className="text-xl font-bold text-ink-800 mb-2">QR Code Not Found</h1>
            <p className="text-sm text-ink-500">This QR code may have been deactivated or doesn't exist. Please contact the business for assistance.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex flex-col">
      <header className="px-4 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span className="h-2 w-2 rounded-full bg-google-green animate-pulse-soft" />
          <span className="hidden sm:inline">Secure connection</span>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Rating (merged intro + rating) ── */}
          {step === 'rating' && (
            <motion.div key="rating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center shadow-glow-blue mb-5">
                <Building2 className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink-800 mb-1 break-words">{business.name}</h1>
              {business.category && <p className="text-sm text-ink-500 mb-6">{business.category}</p>}

              <h2 className="text-lg font-bold text-ink-800 mb-2">How was your experience?</h2>
              <p className="text-sm text-ink-500 mb-6">Tap a star to rate your visit</p>

              <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button key={n} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}>
                    <Star className={`h-10 w-10 sm:h-12 sm:w-12 transition-colors ${(hoverRating || rating) >= n ? 'fill-google-yellow text-google-yellow' : 'text-ink-300'}`} />
                  </motion.button>
                ))}
              </div>

              <div className="h-6 mb-5">
                {rating > 0 && <span className="text-sm font-semibold text-ink-700">{RATING_LABELS[rating]}</span>}
              </div>

              {rating > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-5 space-y-4 overflow-hidden">
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-2 text-left">Review Tone</label>
                    <div className="flex flex-wrap gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTone(t.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            tone === t.value
                              ? 'bg-google-blue text-white border border-google-blue'
                              : 'bg-white text-ink-500 border border-ink-200 hover:border-ink-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-2 text-left">Review Length</label>
                    <div className="flex gap-2">
                      {LENGTHS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setReviewLength(l.value)}
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            reviewLength === l.value
                              ? 'bg-google-blue text-white border border-google-blue'
                              : 'bg-white text-ink-500 border border-ink-200 hover:border-ink-300'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <Button size="lg" className="w-full" onClick={handleContinue} disabled={rating === 0} rightIcon={<ArrowRight className="h-4 w-4" />}>
                {rating === 0 ? 'Select a rating to continue' : 'Continue'}
              </Button>

            </motion.div>
          )}

          {/* ── Step 2: Reviews (merged suggestions + edit) ── */}
          {step === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg">
              <div className="text-center mb-5">
                <div className="flex justify-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < rating ? 'fill-google-yellow text-google-yellow' : 'text-ink-300'}`} />)}
                </div>
                <h2 className="text-xl font-bold text-ink-800 mb-1">{rating <= 3 ? 'Share your feedback' : 'Choose a review'}</h2>
                <p className="text-sm text-ink-500">{rating <= 3 ? 'Select a draft to edit, then submit your feedback privately' : 'Tap a suggestion to edit it, then copy & open Google'}</p>
              </div>

              {generating ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-ink-200/70 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} className="h-6 w-6 rounded-full bg-google-blue/15 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-google-blue" />
                        </motion.div>
                        <span className="text-xs font-medium text-ink-400">Generating fresh suggestions…</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 rounded bg-ink-100 animate-pulse-soft" style={{ width: '100%' }} />
                        <div className="h-3 rounded bg-ink-100 animate-pulse-soft" style={{ width: `${85 - i * 5}%` }} />
                        <div className="h-3 rounded bg-ink-100 animate-pulse-soft" style={{ width: `${92 - i * 8}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Top: 3 review suggestion cards */}
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -2 }}
                        onClick={() => selectReview(i)}
                        className={`w-full text-left rounded-2xl bg-white border-2 shadow-card p-4 sm:p-5 transition-all ${
                          selectedIndex === i
                            ? 'border-google-blue ring-2 ring-google-blue/20 bg-google-blue/5'
                            : 'border-ink-200/70 hover:border-ink-300 hover:shadow-float'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-google-yellow text-google-yellow" />)}
                          </div>
                          {selectedIndex === i ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-google-blue">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} /> Selected
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-google-blue bg-google-blue/10 px-2 py-0.5 rounded-full">{s.sentiment}</span>
                          )}
                        </div>
                        <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">{s.text}</p>
                      </motion.button>
                    ))}
                  </div>

                  {/* Refresh button */}
                  <div className="mt-3 flex justify-center">
                    <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />} onClick={refreshSuggestions} disabled={generating}>
                      Generate New Suggestions
                    </Button>
                  </div>

                  {/* Bottom: editable textarea */}
                  {selectedIndex !== null && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pencil className="h-4 w-4 text-google-blue" />
                        <span className="text-sm font-bold text-ink-800">Edit your review</span>
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={6}
                        className="w-full p-4 rounded-2xl bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-1 mb-4">
                        <span className="text-xs text-ink-400">{reviewText.length} characters</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Customer info fields for low ratings */}
                  {rating <= 3 && selectedIndex !== null && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-ink-500 mb-1.5 text-left">Your Name (optional)</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-500 mb-1.5 text-left">Email (optional)</label>
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="jane@email.com"
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit button — different for low vs high ratings */}
                  <div className="mt-4 sticky bottom-4 z-10">
                    <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-ink-200/70 shadow-float p-3">
                      {rating <= 3 ? (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={submitFeedback}
                          disabled={selectedIndex === null || submitting}
                          loading={submitting}
                          leftIcon={submitting ? undefined : <Send className="h-4 w-4" />}
                        >
                          {selectedIndex === null ? 'Select a feedback draft first' : 'Submit Feedback'}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={copyAndOpenGoogle}
                          disabled={selectedIndex === null || actionLoading}
                          loading={actionLoading}
                          leftIcon={actionLoading ? undefined : <Copy className="h-4 w-4" />}
                          rightIcon={actionLoading ? undefined : <ExternalLink className="h-4 w-4" />}
                        >
                          {selectedIndex === null ? 'Select a review first' : 'Copy Review & Open Google'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setStep('rating')} className="mt-3 w-full text-center text-xs text-ink-500 hover:text-ink-700 transition-colors">
                    Back to rating
                  </button>
                </>
              )}
            </motion.div>
          )}
          {/* ── Step 3: Thank You (low ratings only) ── */}
          {step === 'thankyou' && (
            <motion.div key="thankyou" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }} className="mx-auto h-20 w-20 rounded-full bg-google-green/15 flex items-center justify-center mb-5">
                <Heart className="h-10 w-10 text-google-green" />
              </motion.div>
              <h2 className="text-2xl font-bold text-ink-800 mb-3">Thank you for your valuable feedback ❤️</h2>
              <p className="text-sm text-ink-500 leading-relaxed mb-6">
                Your feedback has been sent privately to the business owner. They appreciate you taking the time to share your experience.
              </p>
              <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
                <div className="flex justify-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className={`h-5 w-5 ${j < rating ? 'fill-google-yellow text-google-yellow' : 'text-ink-200'}`} />)}
                </div>
                <p className="text-sm text-ink-600 leading-relaxed text-left">{reviewText || (selectedIndex !== null ? suggestions[selectedIndex]?.text : '')}</p>
              </div>
              <p className="mt-6 text-xs text-ink-400">You can now close this page.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-ink-400">
        Powered by <span className="font-semibold text-ink-600">ReviewFlow AI</span>
      </footer>
    </div>
  );
}
