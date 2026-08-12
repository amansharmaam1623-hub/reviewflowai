import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/public/LegalPage';
import { usePageMeta } from '@/lib/usePageMeta';

const sections: LegalSection[] = [
  {
    heading: 'Acceptance of Terms',
    body: (
      <p>
        By accessing or using ReviewFlow AI ("the Service"), you agree to be bound by these Terms of Service ("Terms").
        If you do not agree to these Terms, please do not use the Service.
      </p>
    ),
  },
  {
    heading: 'Account Registration',
    body: (
      <p>
        To use the Service, you must create an account with a valid email address and password. You are responsible
        for maintaining the security of your account credentials and for all activity under your account. You must be
        at least 16 years old to create an account.
      </p>
    ),
  },
  {
    heading: 'Use of the Service',
    body: (
      <p>
        ReviewFlow AI provides AI-powered review management tools including QR code generation, review suggestion,
        review response, analytics, and reputation monitoring. You agree to use the Service only for lawful purposes
        and in accordance with these Terms.
      </p>
    ),
  },
  {
    heading: 'Business Accounts',
    body: (
      <p>
        Each account is associated with one or more business locations depending on your plan. You are responsible
        for providing accurate business information and for ensuring you have the right to manage the Google Business
        Profile you connect.
      </p>
    ),
  },
  {
    heading: 'Subscription & Billing',
    body: (
      <p>
        We offer subscription plans with monthly and yearly billing options. Pricing is displayed on our <Link to="/pricing" className="text-google-blue hover:underline">Pricing page</Link>. By subscribing, you authorize us to charge
        your payment method for the selected plan and billing cycle.
      </p>
    ),
  },
  {
    heading: 'Subscription Activation',
    body: (
      <p>
        Payment is required before accessing the Service. After selecting a plan and completing payment via Razorpay,
        your subscription is activated immediately. You are charged automatically based on your selected billing cycle
        (monthly or yearly) until you cancel.
      </p>
    ),
  },
  {
    heading: 'Payments',
    body: (
      <p>
        Payments are processed through our payment provider, Razorpay. We do not store your card details on our
        servers. Billing occurs automatically based on your selected billing cycle (monthly or yearly).
      </p>
    ),
  },
  {
    heading: 'Cancellation',
    body: (
      <p>
        You can cancel your subscription at any time from your dashboard. Cancellation takes effect at the end of the
        current billing period. No additional charges are made after cancellation, but payments already made are not
        refunded.
      </p>
    ),
  },
  {
    heading: 'Refunds',
    body: (
      <p>
        Subscription payments are non-refundable except where required by law. If you cancel during a billing period,
        you retain access to the Service until the end of that period.
      </p>
    ),
  },
  {
    heading: 'User Responsibilities',
    body: (
      <>
        <p>You agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate and current information</li>
          <li>Not misuse the Service to generate fake or misleading reviews</li>
          <li>Not interfere with or disrupt the Service</li>
          <li>Not attempt to access data belonging to other users</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'AI-Generated Content',
    body: (
      <p>
        ReviewFlow AI generates review suggestions and responses using artificial intelligence. AI-generated content
        may not always be accurate or appropriate. You are responsible for reviewing and approving all content before
        it is published. We are not liable for the content of AI-generated suggestions or responses.
      </p>
    ),
  },
  {
    heading: 'Google Reviews / Third-Party Services',
    body: (
      <p>
        Our Service integrates with Google and other third-party platforms. We are not responsible for the policies,
        practices, or actions of these third parties. Your use of Google services is subject to Google's Terms of
        Service.
      </p>
    ),
  },
  {
    heading: 'Intellectual Property',
    body: (
      <p>
        The Service, including its design, features, and branding, is owned by ReviewFlow AI and protected by
        intellectual property laws. You may not copy, modify, or distribute our content without permission. Content
        you create (reviews, responses) remains yours.
      </p>
    ),
  },
  {
    heading: 'Prohibited Activities',
    body: (
      <>
        <p>You may not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Generate fake, misleading, or incentivized reviews</li>
          <li>Use the Service to harass, defame, or harm others</li>
          <li>Attempt to reverse engineer or hack the Service</li>
          <li>Share your account credentials with others</li>
          <li>Use the Service for any illegal activity</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Service Availability',
    body: (
      <p>
        We strive to maintain high availability but do not guarantee uninterrupted access. We may perform
        maintenance, updates, or changes that temporarily affect the Service. We are not liable for downtime caused
        by factors beyond our control.
      </p>
    ),
  },
  {
    heading: 'Disclaimer',
    body: (
      <p>
        The Service is provided "as is" and "as available" without warranties of any kind, whether express or
        implied. We do not guarantee that the Service will be error-free, secure, or available at all times.
      </p>
    ),
  },
  {
    heading: 'Limitation of Liability',
    body: (
      <p>
        To the maximum extent permitted by law, ReviewFlow AI shall not be liable for any indirect, incidental,
        special, or consequential damages arising from your use of the Service. Our total liability shall not exceed
        the amount you paid in the preceding 12 months.
      </p>
    ),
  },
  {
    heading: 'Termination',
    body: (
      <p>
        We may suspend or terminate your account if you violate these Terms or engage in harmful activity. You may
        close your account at any time. Upon termination, your data is deleted in accordance with our <Link to="/privacy-policy" className="text-google-blue hover:underline">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    heading: 'Changes to Terms',
    body: (
      <p>
        We may update these Terms from time to time. We will notify you of significant changes by posting the updated
        Terms on this page. Continued use of the Service after changes constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    heading: 'Governing Law',
    body: (
      <p>
        These Terms are governed by the laws applicable in the jurisdiction where the Service is operated. Any
        disputes shall be resolved in the courts of that jurisdiction.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    body: (
      <p>
        If you have questions about these Terms, please <Link to="/contact" className="text-google-blue hover:underline">contact us</Link>.
      </p>
    ),
  },
];

export function TermsOfServicePage() {
  usePageMeta(
    'Terms of Service | ReviewFlow AI',
    'ReviewFlow AI Terms of Service: account registration, subscriptions, billing, payments, cancellation, refunds, user responsibilities, AI content, and more.',
  );

  return (
    <LegalPage
      eyebrow="Legal"
      title={<>Terms of <span className="gradient-text">Service</span></>}
      subtitle="The terms under which you may use ReviewFlow AI."
      lastUpdated="August 9, 2026"
      sections={sections}
    />
  );
}
