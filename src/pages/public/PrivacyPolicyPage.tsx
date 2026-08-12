import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/public/LegalPage';
import { usePageMeta } from '@/lib/usePageMeta';

const sections: LegalSection[] = [
  {
    heading: 'Introduction',
    body: (
      <p>
        ReviewFlow AI ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains
        how we collect, use, store, and protect your information when you use our platform. By using ReviewFlow AI,
        you agree to the practices described in this policy.
      </p>
    ),
  },
  {
    heading: 'Information We Collect',
    body: (
      <>
        <p>We collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account information (name, email, password)</li>
          <li>Business information (business name, category, location, contact details)</li>
          <li>Review data (reviews collected, generated, and managed through our platform)</li>
          <li>Usage data (how you interact with our platform, device information, IP address)</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Account Information',
    body: (
      <p>
        When you create an account, we collect your name, email address, and a password. This information is used to
        authenticate you, communicate with you, and secure your account. We do not sell your account information to
        third parties.
      </p>
    ),
  },
  {
    heading: 'Business Information',
    body: (
      <p>
        To provide our services, we collect your business name, category, Google Business Profile link, review link,
        and other details you provide during onboarding. This information is used to generate QR codes, analyze
        reviews, and display your reputation dashboard.
      </p>
    ),
  },
  {
    heading: 'Review Data',
    body: (
      <p>
        We process review data — including AI-generated review suggestions, customer feedback, and your responses —
        to provide and improve our services. This data is associated with your business and is not shared with other
        users unless you choose to make it public.
      </p>
    ),
  },
  {
    heading: 'How We Use Information',
    body: (
      <>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide, maintain, and improve our services</li>
          <li>Authenticate your account and secure your data</li>
          <li>Generate AI-powered review suggestions and responses</li>
          <li>Send you notifications about reviews, account activity, and updates</li>
          <li>Analyze usage patterns to improve user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Data Storage',
    body: (
      <p>
        Your data is stored on secure cloud infrastructure provided by our hosting partners. All data is encrypted in
        transit and at rest. We retain your data for as long as your account is active or as needed to provide our
        services. You can request deletion of your data at any time.
      </p>
    ),
  },
  {
    heading: 'Data Security',
    body: (
      <p>
        We implement industry-standard security measures including encryption, access controls, and regular security
        reviews. However, no method of transmission over the internet is completely secure, and we cannot guarantee
        absolute security.
      </p>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>
        We use cookies and similar technologies to authenticate sessions, remember preferences, and analyze usage.
        You can control cookies through your browser settings. See our <Link to="/cookie-policy" className="text-google-blue hover:underline">Cookie Policy</Link> for details.
      </p>
    ),
  },
  {
    heading: 'Third-Party Services',
    body: (
      <p>
        We integrate with third-party services including payment processors and analytics providers. These services
        have their own privacy policies, and we are not responsible for their data practices.
      </p>
    ),
  },
  {
    heading: 'Google Services / Google Reviews',
    body: (
      <p>
        ReviewFlow AI integrates with Google services to help you manage your Google reviews. We do not store your
        Google account credentials. Review data fetched from Google is used solely to display and manage your
        reviews within our platform. Your use of Google services is subject to Google's Privacy Policy and Terms of
        Service.
      </p>
    ),
  },
  {
    heading: 'Data Retention',
    body: (
      <p>
        We retain your data for as long as your account is active. If you cancel your subscription, we retain your
        data for a limited period to allow for reactivation, after which it is permanently deleted. You can request
        immediate deletion at any time by contacting us.
      </p>
    ),
  },
  {
    heading: 'User Rights',
    body: (
      <>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data</li>
          <li>Withdraw consent for data processing</li>
        </ul>
        <p>To exercise these rights, contact us through our <Link to="/contact" className="text-google-blue hover:underline">Contact page</Link>.</p>
      </>
    ),
  },
  {
    heading: "Children's Privacy",
    body: (
      <p>
        ReviewFlow AI is not intended for use by children under the age of 16. We do not knowingly collect personal
        information from children. If you believe a child has provided us with personal data, please contact us so we
        can delete it.
      </p>
    ),
  },
  {
    heading: 'Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the
        updated policy on this page and updating the "Last updated" date. Continued use of ReviewFlow AI after
        changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    body: (
      <p>
        If you have questions about this Privacy Policy, please <Link to="/contact" className="text-google-blue hover:underline">contact us</Link>.
      </p>
    ),
  },
];

export function PrivacyPolicyPage() {
  usePageMeta(
    'Privacy Policy | ReviewFlow AI',
    'ReviewFlow AI Privacy Policy: how we collect, use, store, and protect your data, including account information, business data, review data, cookies, and your rights.',
  );

  return (
    <LegalPage
      eyebrow="Legal"
      title={<>Privacy <span className="gradient-text">Policy</span></>}
      subtitle="Your privacy matters to us. This policy explains how we handle your data."
      lastUpdated="August 9, 2026"
      sections={sections}
    />
  );
}
