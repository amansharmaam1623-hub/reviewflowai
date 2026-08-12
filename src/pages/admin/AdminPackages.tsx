import { motion } from 'framer-motion';
import { Package, Users, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePackages, useAllSubscriptions } from '@/lib/hooks';
import { AdminHeader } from '@/components/admin/AdminHeader';

const colorMap: Record<string, string> = {
  Starter: 'border-google-blue/30 bg-google-blue/5',
  Professional: 'border-google-green/30 bg-google-green/5',
  Enterprise: 'border-google-red/30 bg-google-red/5',
};

export function AdminPackages() {
  const { packages, loading } = usePackages();
  const { subscriptions } = useAllSubscriptions();

  const getSubCount = (planName: string) => subscriptions.filter((s) => s.plan.toLowerCase() === planName.toLowerCase()).length;

  return (
    <>
      <AdminHeader title="Manage Packages" subtitle="Configure pricing plans and features" />
      <div className="flex justify-end mb-4">
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>New Package</Button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-sm text-ink-500">Loading…</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {packages.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`rounded-2xl border-2 p-6 ${colorMap[p.name] ?? 'border-ink-200 bg-ink-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-ink-600" />
                  <h3 className="text-lg font-bold text-ink-800">{p.name}</h3>
                </div>
                <Badge color="gray"><Users className="h-3 w-3" /> {getSubCount(p.name)}</Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-ink-800">${p.price_monthly}</span>
                <span className="text-sm text-ink-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-5">
                {(Array.isArray(p.features) ? p.features : Array.isArray(p.features?.features) ? p.features.features : []).map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-ink-600">
                    <Check className="h-3.5 w-3.5 text-google-green shrink-0" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="w-full">Edit Package</Button>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
