import { useMemo } from 'react';
import { useSubscription, useBusinesses, useReviews } from '@/lib/hooks';
import {
  type PlanId,
  type FeatureId,
  getPlanConfig,
  getPlanRank,
  isFeatureAvailable,
} from '@/lib/plans';

export interface SubscriptionAccess {
  plan: PlanId;
  status: string;
  billingCycle: string;
  isActive: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  hasSubscription: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  businessLimit: number;
  businessCount: number;
  reviewLimit: number; // -1 = unlimited
  reviewsUsedThisMonth: number;
  reviewsRemaining: number; // -1 = unlimited
  canCreateBusiness: boolean;
  canUseFeature: (feature: FeatureId) => boolean;
  canUpgradeTo: (targetPlan: string) => boolean;
  canDowngradeTo: (targetPlan: string) => boolean;
  isCurrentPlan: (targetPlan: string) => boolean;
  loading: boolean;
  subscription: import('@/lib/supabase').Subscription | null;
  refetch: () => Promise<void>;
}

function getBillingPeriodStart(periodStart: Date | null, createdAt: string | null): Date {
  if (periodStart) return periodStart;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function useSubscriptionAccess(): SubscriptionAccess {
  const { subscription, loading, refetch } = useSubscription();
  const { businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { reviews } = useReviews(businessIds);

  return useMemo(() => {
    // Derive plan from the joined package slug, falling back to 'starter'
    const planSlug = subscription?.package?.slug ?? 'starter';
    const plan = planSlug as PlanId;
    const status = subscription?.status ?? 'pending';
    const config = getPlanConfig(plan);

    const currentPeriodStart = subscription?.current_period_start
      ? new Date(subscription.current_period_start)
      : null;
    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    const isActive = status === 'active';
    const isPastDue = status === 'past_due' || status === 'payment_failed';
    const isCancelled = status === 'cancelled';
    const isExpired = status === 'expired';
    const hasSubscription = subscription != null;

    const billingStart = getBillingPeriodStart(currentPeriodStart, subscription?.created_at ?? null);
    const reviewsUsedThisMonth = reviews.filter(
      (r) => new Date(r.created_at) >= billingStart,
    ).length;
    const reviewLimit = config.monthlyReviewLimit;
    const reviewsRemaining = reviewLimit === -1 ? -1 : Math.max(0, reviewLimit - reviewsUsedThisMonth);

    const businessCount = businesses.length;
    const businessLimit = config.businessLimit;
    const canCreateBusiness =
      isActive &&
      (businessLimit === -1 || businessCount < businessLimit);

    const canUseFeature = (feature: FeatureId) => {
      if (!isActive) return false;
      return isFeatureAvailable(plan, feature);
    };

    const canUpgradeTo = (targetPlan: string) =>
      getPlanRank(targetPlan) > getPlanRank(plan);
    const canDowngradeTo = (targetPlan: string) =>
      getPlanRank(targetPlan) < getPlanRank(plan);
    const isCurrentPlan = (targetPlan: string) =>
      getPlanRank(targetPlan) === getPlanRank(plan);

    return {
      plan,
      status,
      billingCycle: subscription?.billing_cycle ?? 'monthly',
      isActive,
      isPastDue,
      isCancelled,
      isExpired,
      hasSubscription,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      businessLimit,
      businessCount,
      reviewLimit,
      reviewsUsedThisMonth,
      reviewsRemaining,
      canCreateBusiness,
      canUseFeature,
      canUpgradeTo,
      canDowngradeTo,
      isCurrentPlan,
      loading,
      subscription,
      refetch,
    };
  }, [subscription, businesses, reviews, loading, refetch]);
}
