import { motion } from 'framer-motion';
import { Search, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAllProfiles } from '@/lib/hooks';
import { AdminHeader } from '@/components/admin/AdminHeader';

export function AdminUsers() {
  const { profiles, loading } = useAllProfiles();

  return (
    <>
      <AdminHeader title="Manage Users" subtitle="All platform users and their roles" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
        <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 mb-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input placeholder="Search users…" className="bg-transparent text-sm text-ink-700 placeholder:text-ink-400 outline-none w-full" />
        </div>
        {loading ? (
          <div className="text-center py-10 text-sm text-ink-500">Loading…</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10 text-sm text-ink-500">No users registered yet.</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                  <th className="font-medium pb-3 pr-4">User</th>
                  <th className="font-medium pb-3 pr-4">Role</th>
                  <th className="font-medium pb-3 pr-4">Joined</th>
                  <th className="font-medium pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center text-white text-xs font-bold">
                          {(p.full_name || p.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-ink-800">{p.full_name || 'Unnamed'}</div>
                          <div className="text-xs text-ink-500">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4"><Badge color={p.role === 'admin' ? 'red' : 'blue'}>{p.role}</Badge></td>
                    <td className="py-3 pr-4 text-ink-600">{new Date(p.created_at).toLocaleDateString()}</td>
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
