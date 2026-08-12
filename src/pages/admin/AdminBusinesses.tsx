import { motion } from 'framer-motion';
import { Search, MoreVertical, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAllBusinesses, useAllSubscriptions } from '@/lib/hooks';
import { AdminHeader } from '@/components/admin/AdminHeader';

export function AdminBusinesses() {
  const { businesses, loading } = useAllBusinesses();
  const { subscriptions } = useAllSubscriptions();

  const getPlan = (userId: string) => {
    const sub = subscriptions.find((s) => s.user_id === userId);
    return sub ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'Starter';
  };

  return (
    <>
      <AdminHeader title="Manage Businesses" subtitle="View and manage all registered businesses" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
        <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 mb-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input placeholder="Search businesses…" className="bg-transparent text-sm text-ink-700 placeholder:text-ink-400 outline-none w-full" />
        </div>
        {loading ? (
          <div className="text-center py-10 text-sm text-ink-500">Loading…</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="h-10 w-10 text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">No businesses registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                  <th className="font-medium pb-3 pr-4">Business</th>
                  <th className="font-medium pb-3 pr-4">Category</th>
                  <th className="font-medium pb-3 pr-4">Plan</th>
                  <th className="font-medium pb-3 pr-4">Status</th>
                  <th className="font-medium pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-ink-800">{b.name || 'Unnamed'}</span>
                          <div className="text-xs text-ink-400">{b.address || 'No address'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-ink-600">{b.category || '—'}</td>
                    <td className="py-3 pr-4"><Badge color={getPlan(b.user_id) === 'Enterprise' ? 'red' : getPlan(b.user_id) === 'Professional' ? 'green' : 'blue'}>{getPlan(b.user_id)}</Badge></td>
                    <td className="py-3 pr-4"><Badge color="green">Active</Badge></td>
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
