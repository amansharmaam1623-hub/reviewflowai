import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Inbox, CheckCircle2, Circle, Mail, User } from 'lucide-react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBusinesses, useFeedback } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export function FeedbackInbox() {
  const { businesses } = useBusinesses();
  const businessIds = businesses.map((b) => b.id);
  const { feedback, loading } = useFeedback(businessIds);
  const { show: showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = feedback.filter((f) => f.status === 'pending').length;
  const resolvedCount = feedback.filter((f) => f.status === 'resolved').length;

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
      if (error) throw error;
      showToast(status === 'resolved' ? 'Feedback marked as resolved.' : 'Feedback moved back to pending.');
      window.location.reload();
    } catch {
      showToast('Failed to update feedback status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Topbar title="Feedback Inbox" subtitle="Private feedback from customers who rated 1-3 stars" />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-google-blue" />
            </div>
            <div>
              <p className="text-xs text-ink-500 font-medium">Total Feedback</p>
              <p className="text-2xl font-bold text-ink-800">{feedback.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-google-yellow/10 flex items-center justify-center">
              <Circle className="h-5 w-5 text-google-yellow" />
            </div>
            <div>
              <p className="text-xs text-ink-500 font-medium">Pending</p>
              <p className="text-2xl font-bold text-ink-800">{pendingCount}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-google-green/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-google-green" />
            </div>
            <div>
              <p className="text-xs text-ink-500 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-ink-800">{resolvedCount}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feedback.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
            <Inbox className="h-7 w-7 text-ink-400" />
          </div>
          <h3 className="text-base font-bold text-ink-700 mb-1">No feedback yet</h3>
          <p className="text-sm text-ink-500 max-w-sm">When customers rate 1-3 stars, their private feedback will appear here for you to review and resolve.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item, i) => {
            const isExpanded = expandedId === item.id;
            const isPending = item.status === 'pending';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-ink-200/70 shadow-card overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-ink-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-ink-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-ink-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-ink-800">{item.customer_name || 'Anonymous'}</span>
                          {item.customer_email && (
                            <span className="flex items-center gap-1 text-xs text-ink-400">
                              <Mail className="h-3 w-3" />
                              {item.customer_email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className={`h-3.5 w-3.5 ${j < (item.rating ?? 0) ? 'fill-google-yellow text-google-yellow' : 'text-ink-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-ink-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color={isPending ? 'yellow' : 'green'}>
                        {isPending ? 'Pending' : 'Resolved'}
                      </Badge>
                    </div>
                  </div>
                  <p className={`text-sm text-ink-600 leading-relaxed mt-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {item.generated_review}
                  </p>
                </div>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-ink-100 px-4 py-3 flex items-center justify-end gap-2">
                    {isPending ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={updatingId === item.id ? undefined : <CheckCircle2 className="h-4 w-4" />}
                        onClick={() => updateStatus(item.id, 'resolved')}
                        disabled={updatingId === item.id}
                        loading={updatingId === item.id}
                      >
                        Mark as Resolved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Circle className="h-4 w-4" />}
                        onClick={() => updateStatus(item.id, 'pending')}
                        disabled={updatingId === item.id}
                        loading={updatingId === item.id}
                      >
                        Move to Pending
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
