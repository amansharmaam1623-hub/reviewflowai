import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'business' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  google_business_url: string | null;
  google_place_id: string | null;
  google_review_link?: string | null;
  seo_keywords?: string[] | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  source: string | null;
  text?: string;
  author_name?: string | null;
  review_source?: string | null;
  business_response?: string | null;
  sentiment: string | null;
  status: string;
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrCode {
  id: string;
  business_id: string;
  user_id: string;
  identifier: string;
  target_url: string | null;
  label: string;
  color: string;
  active: boolean;
  scans: number;
  download_count?: number;
  last_scan?: string | null;
  scan_count: number;
  last_scan_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string | null;
  status: string;
  billing_cycle: string;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_plan_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_invoice_id: string | null;
  amount: number | null;
  currency: string;
  status: string;
  payment_type: string | null;
  plan: string;
  invoice_id?: string | null;
  billing_cycle: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  razorpay_plan_id_monthly: string | null;
  razorpay_plan_id_yearly: string | null;
  business_limit: number;
  review_limit: number | null;
  features: Record<string, unknown> | string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  business_id: string;
  user_id: string;
  rating: number | null;
  feedback_text: string | null;
  source: string;
  generated_review?: string | null;
  review_source?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  sentiment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
