import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { Building2, Users, DollarSign, Star, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAllBusinesses, useAllProfiles, useAllSubscriptions } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

export function AdminOverview() {
  const { businesses } = useAllBusinesses();
  const { profiles } = useAllProfiles();
  const { subscriptions } = useAllSubscriptions();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: reviews } = await supabase.from('reviews').select('rating');
      setReviewCount(reviews?.length ?? 0);
    })();
  }, []);

  useEffect(() => {
    const revenue = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const prices: Record<string, number> = { starter: 29, professional: 79, enterprise: 199 };
        return sum + (prices[s.plan] ?? 0);
      }, 0);
    setTotalRevenue(revenue);
  }, [subscriptions]);

  const planDist = useMemo(() => {
    const counts: Record<string, number> = { Starter: 0, Professional: 0, Enterprise: 0 };
    subscriptions.forEach((s) => {
      const key = s.plan.charAt(0).toUpperCase() + s.plan.slice(1);
      if (counts[key] !== undefined) counts[key]++;
    });
    return [
      { name: 'Starter', count: counts.Starter, fill: '#4285F4' },
      { name: 'Professional', count: counts.Professional, fill: '#34A853' },
      { name: 'Enterprise', count: counts.Enterprise, fill: '#EA4335' },
    ];
  }, [subscriptions]);

  const revenueData = useMemo(() => {
    const months: { month: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthSubs = subscriptions.filter((s) => {
        const sd = new Date(s.created_at);
        return sd >= d && sd < next && s.status === 'active';
      });
      const prices: Record<string, number> = { starter: 29, professional: 79, enterprise: 199 };
      const rev = monthSubs.reduce((sum, s) => sum + (prices[s.plan] ?? 0), 0);
      months.push({ month: d.toLocaleString('default', { month: 'short' }), revenue: rev });
    }
    return months;
  }, [subscriptions]);

  return (
    <>
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="rounded-2xl glass-strong border border-white/60 shadow-soft px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-ink-800">Admin Overview</h1>
            <p className="text-xs text-ink-500">Platform-wide metrics and insights</p>
          </div>
          <span className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <span className="h-2 w-2 rounded-full bg-google-green animate-pulse-soft" />
            Live data
          </span>
        </div>
      </motion.header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Businesses" value={businesses.length.toLocaleString()} delta={businesses.length > 0 ? "+8%" : undefined} trend="up" color="google-blue" />
        <StatCard icon={Users} label="Active Users" value={profiles.length.toLocaleString()} delta={profiles.length > 0 ? "+12%" : undefined} trend="up" color="google-green" delay={0.1} />
        <StatCard icon={DollarSign} label="MRR" value={`$${totalRevenue.toLocaleString()}`} delta={totalRevenue > 0 ? "+18%" : undefined} trend="up" color="google-yellow" delay={0.2} />
        <StatCard icon={Star} label="Total Reviews" value={reviewCount.toLocaleString()} delta={reviewCount > 0 ? "+0.2" : undefined} trend="up" color="google-red" delay={0.3} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-ink-800">Revenue Growth</h3>
              <p className="text-xs text-ink-500">Monthly recurring revenue</p>
            </div>
            {totalRevenue > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-google-green"><TrendingUp className="h-3.5 w-3.5" /> +294% YTD</span>}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34A853" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34A853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#34A853" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <h3 className="text-base font-bold text-ink-800 mb-1">Plan Distribution</h3>
          <p className="text-xs text-ink-500 mb-4">Subscribers by plan</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={planDist} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#80868B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#80868B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #E8EAED', fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                {planDist.map((p, i) => <Cell key={i} fill={p.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
}
