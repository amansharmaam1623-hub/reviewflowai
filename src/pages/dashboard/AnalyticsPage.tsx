import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Cell,
} from 'recharts';
import { TrendingUp, Star, Clock, ThumbsUp, Lock } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { useBusinesses, useReviews } from '@/lib/hooks';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function AnalyticsPage() {
  const { businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { reviews, loading } = useReviews(businessIds);
  const access = useSubscriptionAccess();
  const navigate = useNavigate();
  const hasAdvancedAnalytics = access.canUseFeature('advanced_analytics');

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
  const respondedCount = reviews.filter((r) => r.business_response && r.business_response.trim().length > 0).length;
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const monthlyData = useMemo(() => {
    const months: { month: string; new: number; responded: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthReviews = reviews.filter((r) => {
        const rd = new Date(r.created_at);
        return rd >= d && rd < next;
      });
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        new: monthReviews.length,
        responded: monthReviews.filter((r) => r.business_response && r.business_response.trim().length > 0).length,
      });
    }
    return months;
  }, [reviews]);

  const sentimentData = useMemo(() => {
    const categories = ['Service', 'Quality', 'Price', 'Atmosphere', 'Cleanliness', 'Speed'];
    return categories.map((subject) => {
      const matching = reviews.filter((r) => (r.text ?? r.review_text ?? '').toLowerCase().includes(subject.toLowerCase()));
      const avgScore = matching.length > 0 ? Math.round((matching.reduce((s, r) => s + (r.rating ?? 0), 0) / matching.length) / 5 * 100) : 0;
      return { subject, value: avgScore };
    });
  }, [reviews]);

  const keywordData = useMemo(() => {
    const stopWords = new Set([
      'the', 'and', 'is', 'was', 'very', 'good', 'great', 'a', 'an', 'to', 'of',
      'in', 'for', 'on', 'at', 'it', 'they', 'my', 'we', 'i', 'this', 'that',
      'with', 'but', 'so', 'had', 'have', 'has', 'are', 'be', 'as', 'not',
      'from', 'or', 'if', 'he', 'she', 'you', 'your', 'their', 'his', 'her',
      'were', 'been', 'will', 'would', 'could', 'should', 'all', 'just',
      'really', 'about', 'out', 'up', 'them', 'there', 'here', 'when',
      'what', 'which', 'who', 'how', 'why', 'did', 'do', 'does', 'done',
      'more', 'most', 'some', 'any', 'no', 'yes', 'can', 'than', 'then',
      'too', 'also', 'only', 'one', 'two', 'three', 'get', 'got', 'like',
      'just', 'even', 'much', 'such', 'over', 'after', 'before', 'into',
      'our', 'us', 'me', 'him', 'am', 'again', 'back', 'still', 'well',
      'very', 'really', 'pretty', 'kinda', 'sort', 'quite', 'enough',
    ]);
    const wordCounts: Record<string, number> = {};
    reviews.forEach((r) => {
      const text = (r.text || '').toLowerCase().replace(/[^a-z\s]/g, ' ');
      text.split(/\s+/).forEach((rawWord) => {
        const w = rawWord.trim();
        if (w.length < 4 || stopWords.has(w)) return;
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });
    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [reviews]);

  if (loading) {
    return (
      <>
        <Topbar title="Review Analytics" subtitle="Deep insights into your review performance and sentiment" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Review Analytics" subtitle="Deep insights into your review performance and sentiment" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Avg Rating" value={avgRating} color="google-yellow" />
        <StatCard icon={TrendingUp} label="Monthly Growth" value={`+${reviews.filter((r) => new Date(r.created_at) > new Date(Date.now() - 30 * 86400000)).length}`} color="google-green" delay={0.1} />
        <StatCard icon={Clock} label="Response Rate" value={`${responseRate}%`} color="google-blue" delay={0.2} />
        <StatCard icon={ThumbsUp} label="Total Reviews" value={totalReviews.toLocaleString()} color="google-red" delay={0.3} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <h3 className="text-base font-bold text-ink-800 mb-1">New vs Responded Reviews</h3>
          <p className="text-xs text-ink-500 mb-4">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Line type="monotone" dataKey="new" stroke="#4285F4" strokeWidth={2.5} dot={{ r: 3, fill: '#4285F4' }} />
              <Line type="monotone" dataKey="responded" stroke="#34A853" strokeWidth={2.5} dot={{ r: 3, fill: '#34A853' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <h3 className="text-base font-bold text-ink-800 mb-1">Sentiment by Category</h3>
          <p className="text-xs text-ink-500 mb-4">AI-analyzed review themes</p>
          {hasAdvancedAnalytics ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={sentimentData}>
                <PolarGrid stroke="#E8EAED" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#5F6368' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#BDC1C6' }} angle={90} domain={[0, 100]} />
                <Radar dataKey="value" stroke="#4285F4" fill="#4285F4" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-center">
              <div className="h-12 w-12 rounded-2xl bg-ink-100 flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-ink-400" />
              </div>
              <p className="text-sm font-semibold text-ink-700 mb-1">Advanced Analytics</p>
              <p className="text-xs text-ink-500 mb-3 max-w-xs">Sentiment analysis is available on the Professional plan and above.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/subscription')}>Upgrade to unlock</Button>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
        <h3 className="text-base font-bold text-ink-800 mb-4">Top Keywords in Reviews</h3>
        {!hasAdvancedAnalytics ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-ink-100 flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-ink-400" />
            </div>
            <p className="text-sm font-semibold text-ink-700 mb-1">Keyword Analysis</p>
            <p className="text-xs text-ink-500 mb-3 max-w-xs">Keyword extraction is available on the Professional plan and above.</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/subscription')}>Upgrade to unlock</Button>
          </div>
        ) : keywordData.every((k) => k.count === 0) ? (
          <div className="flex items-center justify-center py-12 text-sm text-ink-500">
            No keyword data yet — start collecting reviews to see insights.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keywordData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
              <XAxis dataKey="word" tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                {keywordData.map((_, i) => <Cell key={i} fill={['#4285F4', '#34A853', '#FBBC05', '#EA4335'][i % 4]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </>
  );
}
