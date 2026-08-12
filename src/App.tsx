import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/lib/useSubscriptionAccess';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ChoosePlanPage } from '@/pages/auth/ChoosePlanPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { QRPage } from '@/pages/dashboard/QRPage';
import { BusinessPage } from '@/pages/dashboard/BusinessPage';
import { SubscriptionPage } from '@/pages/dashboard/SubscriptionPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { SupportPage } from '@/pages/dashboard/SupportPage';
import { FeedbackInbox } from '@/pages/dashboard/FeedbackInbox';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminBusinesses } from '@/pages/admin/AdminBusinesses';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminPackages } from '@/pages/admin/AdminPackages';
import { AdminPayments } from '@/pages/admin/AdminPayments';
import { ReviewFlow } from '@/pages/ReviewFlow';
import { OnboardingWizard } from '@/pages/onboarding/OnboardingWizard';
import { ThankYouPage } from '@/pages/ThankYouPage';
import { FeaturesPage } from '@/pages/public/FeaturesPage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { PricingPage } from '@/pages/public/PricingPage';
import { FAQPage } from '@/pages/public/FAQPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { PrivacyPolicyPage } from '@/pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/public/TermsOfServicePage';
import { CookiePolicyPage } from '@/pages/public/CookiePolicyPage';

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  if (loading) return null;
  if (!session) return <>{children}</>;
  if (!profile) return null;
  if (access.loading) return null;
  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (!access.isActive) {
    return <Navigate to="/choose-plan" replace />;
  }
  if (!profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingRoute() {
  const { session, profile, loading, emailVerified } = useAuth();
  const access = useSubscriptionAccess();
  if (loading || access.loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!emailVerified) return <Navigate to="/verify-email" replace />;
  if (!access.isActive) return <Navigate to="/choose-plan" replace />;
  if (profile?.onboarding_completed) return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <OnboardingWizard />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
          <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/choose-plan" element={<ChoosePlanPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/thank-you" element={<AuthOnlyRoute><ThankYouPage /></AuthOnlyRoute>} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="business" />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="qr" element={<QRPage />} />
              <Route path="business" element={<BusinessPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="feedback" element={<FeedbackInbox />} />
            </Route>
          </Route>
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="businesses" element={<AdminBusinesses />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>
          </Route>
          <Route path="/review/:id" element={<ReviewFlow />} />
          <Route path="/review/demo" element={<ReviewFlow />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
