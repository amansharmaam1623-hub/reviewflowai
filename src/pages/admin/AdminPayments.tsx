import { motion } from 'framer-motion';
import { Search, MoreVertical, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAllPayments, useAllSubscriptions } from '@/lib/hooks';
import { AdminHeader } from '@/components/admin/AdminHeader';

export function AdminPayments() {
  const { payments, loading } = useAllPayments();
  const { subscriptions } = useAllSubscriptions();

  const totalRevenue = subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => {
    const prices: Record<string, number> = { starter: 29, professional: 79, enterprise: 199 };
    return sum + (prices[s.plan] ?? 0);
  }, 0);

  return (
    <>
      <AdminHeader title="Payments" subtitle="All transactions and billing history" />
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'google-green' },
          { label: 'Failed Payments', value: payments.filter((p) => p.status === 'failed').length.toString(), color: 'google-red' },
          { label: 'Refunds', value: payments.filter((p) => p.status === 'refunded').length.toString(), color: 'google-yellow' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`h-4 w-4 text-${s.color}`} />
              <span className="text-sm text-ink-500">{s.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-ink-800">{s.value}</div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
        <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 mb-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input placeholder="Search payments…" className="bg-transparent text-sm text-ink-700 placeholder:text-ink-400 outline-none w-full" />
        </div>
        {loading ? (
          <div className="text-center py-10 text-sm text-ink-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign className="h-10 w-10 text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">No payment records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                  <th className="font-medium pb-3 pr-4">Invoice</th>
                  <th className="font-medium pb-3 pr-4">Plan</th>
                  <th className="font-medium pb-3 pr-4">Amount</th>
                  <th className="font-medium pb-3 pr-4">Date</th>
                  <th className="font-medium pb-3 pr-4">Status</th>
                  <th className="font-medium pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-ink-500">{p.invoice_id || p.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4"><Badge color={p.plan === 'enterprise' ? 'red' : p.plan === 'professional' ? 'green' : 'blue'}>{p.plan || '—'}</Badge></td>
                    <td className="py-3 pr-4 font-semibold text-ink-800">${p.amount}</td>
                    <td className="py-3 pr-4 text-ink-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-4"><Badge color={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}>{p.status}</Badge></td>
                    <td className="py-3 text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-ink-100 flex items-center justify-center transition-colors inline-flex">
                        <MoreVertical className="h-4 w-4 text-ink-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </>
  );
}
