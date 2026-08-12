export type PlanId = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'payment_failed'
  | 'cancelled'
  | 'expired'
  | 'incomplete';

export type FeatureId =
  | 'advanced_analytics'
  | 'ai_response_suggestions'
  | 'review_monitoring'
  | 'team_accounts'
  | 'custom_branding'
  | 'api_access';

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number; // per-month price for yearly billing (display)
  priceYearlyTotal: number; // actual yearly charge
  businessLimit: number;
  monthlyReviewLimit: number; // -1 = unlimited
  features: FeatureId[];
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 799,
    priceYearly: 639,
    priceYearlyTotal: 7668,
    businessLimit: 1,
    monthlyReviewLimit: 100,
    features: [],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 1699,
    priceYearly: 1359,
    priceYearlyTotal: 16308,
    businessLimit: 3,
    monthlyReviewLimit: -1,
    features: ['advanced_analytics', 'ai_response_suggestions', 'review_monitoring'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 5999,
    priceYearly: 4799,
    priceYearlyTotal: 57588,
    businessLimit: 10,
    monthlyReviewLimit: -1,
    features: [
      'advanced_analytics',
      'ai_response_suggestions',
      'review_monitoring',
      'team_accounts',
      'custom_branding',
      'api_access',
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['starter', 'professional', 'enterprise'];

export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIG[plan as PlanId] ?? PLAN_CONFIG.starter;
}

export function getPlanRank(plan: string): number {
  const idx = PLAN_ORDER.indexOf(plan as PlanId);
  return idx === -1 ? 0 : idx;
}

export function isFeatureAvailable(plan: string, feature: FeatureId): boolean {
  const config = getPlanConfig(plan);
  return config.features.includes(feature);
}

export function getBusinessLimit(plan: string): number {
  return getPlanConfig(plan).businessLimit;
}

export function getReviewLimit(plan: string): number {
  return getPlanConfig(plan).monthlyReviewLimit;
}
