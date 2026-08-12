import { useEffect, useState, useCallback } from 'react';
import { supabase, type Business, type Review, type QrCode, type Subscription, type Package, type Profile, type Payment, type Feedback } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useBusinesses() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBusinesses((data as Business[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);
  return { businesses, loading, refetch };
}

export function useReviews(businessIds: string[]) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (businessIds.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .in('business_id', businessIds)
      .order('created_at', { ascending: false });
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }, [businessIds]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (businessIds.length === 0) return;
    const channel = supabase
      .channel(`reviews-realtime-${businessIds.join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessIds, refetch]);

  return { reviews, loading, refetch };
}

export function useQrCodes(businessIds: string[]) {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (businessIds.length === 0) {
      setQrCodes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .in('business_id', businessIds)
      .order('created_at', { ascending: false });
    setQrCodes((data as QrCode[]) ?? []);
    setLoading(false);
  }, [businessIds]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (businessIds.length === 0) return;
    const channel = supabase
      .channel(`qr-realtime-${businessIds.join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_codes' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessIds, refetch]);

  return { qrCodes, loading, refetch };
}

export interface SubscriptionWithPackage extends Subscription {
  plan: string;
  package?: Pick<Package, 'id' | 'name' | 'slug' | 'business_limit' | 'review_limit' | 'price_monthly' | 'price_yearly'> | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithPackage | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('*, package:packages(id, name, slug, business_limit, review_limit, price_monthly, price_yearly)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();
    setSubscription(data as SubscriptionWithPackage | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscription-realtime-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  return { subscription, loading, refetch };
}

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPayments((data as Payment[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);
  return { payments, loading, refetch };
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true });
      setPackages((data as Package[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return { packages, loading };
}

// ===== Admin hooks =====

export function useAllProfiles() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  return { profiles, loading };
}

export function useAllBusinesses() {
  const { profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    (async () => {
      const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      setBusinesses((data as Business[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  return { businesses, loading };
}

export function useAllSubscriptions() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    (async () => {
      const { data } = await supabase.from('subscriptions')
        .select('*, package:packages(id, name, slug, business_limit, review_limit, price_monthly, price_yearly)')
        .order('created_at', { ascending: false });
      setSubscriptions((data as SubscriptionWithPackage[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  return { subscriptions, loading };
}

export function useAllPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    (async () => {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      setPayments((data as Payment[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  return { payments, loading };
}

export function useFeedback(businessIds: string[]) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (businessIds.length === 0) {
      setFeedback([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .in('business_id', businessIds)
      .order('created_at', { ascending: false });
    setFeedback((data as Feedback[]) ?? []);
    setLoading(false);
  }, [businessIds]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (businessIds.length === 0) return;
    const channel = supabase
      .channel(`feedback-realtime-${businessIds.join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessIds, refetch]);

  return { feedback, loading, refetch };
}
