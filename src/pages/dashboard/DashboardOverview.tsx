import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { Star, MessageSquare, Eye, QrCode, Sparkles } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useBusinesses, useReviews, useQrCodes } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';

export function DashboardOverview() {
  const { profile } = useAuth();
  const { businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { reviews, loading: reviewsLoading } = useReviews(businessIds);
  const { qrCodes, loading: qrLoading } = useQrCodes(businessIds);

  const loading = reviewsLoading || qrLoading;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
  const totalScans = qrCodes.reduce((s, q) => s + (q.scans || 0), 0);
  const respondedCount = reviews.filter((r) => r.business_response && r.business_response.trim().length > 0).length;
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    name: `${star}★`,
    value: reviews.filter((r) => r.rating === star).length,
    fill: star === 5 ? '#34A853' : star === 4 ? '#4285F4' : star === 3 ? '#FBBC05' : star === 2 ? '#FB8C00' : '#EA4335',
  }));

  const reviewTrend = useMemo(() => {
    const months: { month: string; reviews: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = reviews.filter((r) => {
        const rd = new Date(r.created_at);
        return rd >= d && rd < next;
      }).length;
      months.push({ month: d.toLocaleString('default', { month: 'short' }), reviews: count });
    }
    return months;
  }, [reviews]);

  const sources = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    reviews.forEach((r) => {
      const src = r.review_source || 'direct';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceLabels: Record<string, string> = {
      qr_code: 'QR Code',
      direct: 'Direct Link',
      google: 'Google',
      website: 'Website',
      other: 'Other',
    };
    const sourceColors: Record<string, string> = {
      qr_code: '#4285F4',
      direct: '#34A853',
      google: '#FBBC05',
      website: '#EA4335',
      other: '#9AA0A6',
    };
    const total = Object.values(sourceCounts).reduce((s, v) => s + v, 0);
    const entries = Object.entries(sourceCounts).map(([key, count]) => ({
      name: sourceLabels[key] || key,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      fill: sourceColors[key] || '#9AA0A6',
    }));
    return entries.length > 0 ? entries : [
      { name: 'QR Code', value: 0, fill: '#4285F4' },
      { name: 'Direct Link', value: 0, fill: '#34A853' },
      { name: 'Other', value: 0, fill: '#9AA0A6' },
    ];
  }, [reviews]);

  const recentReviews = reviews.slice(0, 4);

  const colorMap: Record<string, string> = {
    'google-blue': 'bg-google-blue',
    'google-green': 'bg-google-green',
    'google-yellow': 'bg-google-yellow',
    'google-red': 'bg-google-red',
  };

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard Overview" subtitle={`Welcome back, ${profile?.full_name || 'there'} — here's what's happening`} />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Dashboard Overview" subtitle={`Welcome back, ${profile?.full_name || 'there'} — here's what's happening`} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Total Reviews" value={totalReviews.toLocaleString()} color="google-yellow" delay={0} />
        <StatCard icon={MessageSquare} label="Avg Rating" value={avgRating} color="google-green" delay={0.1} />
        <StatCard icon={Eye} label="QR Scans" value={totalScans.toLocaleString()} color="google-blue" delay={0.2} />
        <StatCard icon={QrCode} label="Response Rate" value={`${responseRate}%`} color="google-red" delay={0.3} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-ink-800">Review Growth</h3>
              <p className="text-xs text-ink-500">Reviews collected over the last 8 months</p>
            </div>
  
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={reviewTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Area type="monotone" dataKey="reviews" stroke="#4285F4" strokeWidth={2.5} fill="url(#reviewGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <h3 className="text-base font-bold text-ink-800 mb-1">Rating Distribution</h3>
          <p className="text-xs text-ink-500 mb-4">Breakdown by star rating</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ratingDist} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#5F6368' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {ratingDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <h3 className="text-base font-bold text-ink-800 mb-4">Recent Reviews</h3>
          {recentReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-ink-100 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-ink-400" />
              </div>
              <p className="text-sm text-ink-500">No reviews yet. Share your QR code to start collecting!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="flex gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className="shrink-0 h-10 w-10 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-xs font-bold">
                    {(r.author_name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-800">{r.author_name || 'Anonymous'}</span>
                      <span className="text-xs text-ink-400 shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5 my-1">
                      {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-3 w-3 fill-google-yellow text-google-yellow" />)}
                    </div>
                    <p className="text-sm text-ink-600 leading-relaxed line-clamp-2">{r.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
            <h3 className="text-base font-bold text-ink-800 mb-1">Traffic Sources</h3>
            <p className="text-xs text-ink-500 mb-3">Where reviews come from</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} paddingAngle={3}>
                  {sources.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ink-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                    {s.name}
                  </span>
                  <span className="font-semibold text-ink-800">{s.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl bg-gradient-to-br from-google-blue/10 to-google-green/5 border border-google-blue/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-google-blue/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-google-blue" />
              </div>
              <span className="text-sm font-bold text-ink-800">AI Insight</span>
            </div>
            <p className="text-sm text-ink-600 leading-relaxed">
              {totalReviews === 0
                ? "Start collecting reviews by generating a QR code and placing it at your business location. More reviews lead to better Google rankings!"
                : "Your reviews are performing well. Consider prompting customers to highlight specific aspects of their experience for even better engagement."}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
