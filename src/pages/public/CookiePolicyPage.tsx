import { Link } from 'react-router-dom';
import { LegalPage, type LegalSection } from '@/components/public/LegalPage';
import { usePageMeta } from '@/lib/usePageMeta';

const sections: LegalSection[] = [
  {
    heading: 'What Cookies Are',
    body: (
      <p>
        Cookies are small text files placed on your device by websites you visit. They allow websites to remember
        your actions and preferences over time, making your experience more efficient and personalized.
      </p>
    ),
  },
  {
    heading: 'Types of Cookies We Use',
    body: (
      <p>
        ReviewFlow AI uses several types of cookies to operate the Service. Below is a description of each type and
        its purpose.
      </p>
    ),
  },
  {
    heading: 'Essential Cookies',
    body: (
      <p>
        These cookies are necessary for the Service to function. They enable core features like authentication,
        security, and session management. Without these cookies, the Service cannot operate.
      </p>
    ),
  },
  {
    heading: 'Authentication Cookies',
    body: (
      <p>
        Authentication cookies allow us to keep you signed in and verify your identity during your session. These
        cookies are removed when you log out or close your browser.
      </p>
    ),
  },
  {
    heading: 'Analytics Cookies',
    body: (
      <p>
        Analytics cookies help us understand how visitors interact with the Service. We use this information to
        improve performance, fix issues, and enhance user experience. This data is aggregated and does not identify
        individual users.
      </p>
    ),
  },
  {
    heading: 'Preference Cookies',
    body: (
      <p>
        Preference cookies remember your settings and choices, such as language or theme preferences. These enhance
        your experience by reducing the need to reconfigure settings on each visit.
      </p>
    ),
  },
  {
    heading: 'Third-Party Cookies',
    body: (
      <p>
        Some cookies are set by third-party services we integrate with, such as payment processors. These third
        parties have their own cookie policies, and we encourage you to review them.
      </p>
    ),
  },
  {
    heading: 'How to Manage Cookies',
    body: (
      <p>
        You can control and delete cookies through your browser settings. Most browsers allow you to block cookies,
        delete existing ones, or set preferences for specific sites. Note that disabling essential cookies may affect
        the functionality of the Service.
      </p>
    ),
  },
  {
    heading: 'Changes to Cookie Policy',
    body: (
      <p>
        We may update this Cookie Policy from time to time. Changes are posted on this page with an updated "Last
        updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    body: (
      <p>
        If you have questions about this Cookie Policy, please <Link to="/contact" className="text-google-blue hover:underline">contact us</Link>.
      </p>
    ),
  },
];

export function CookiePolicyPage() {
  usePageMeta(
    'Cookie Policy | ReviewFlow AI',
    'ReviewFlow AI Cookie Policy: types of cookies we use, including essential, authentication, analytics, preference, and third-party cookies, and how to manage them.',
  );

  return (
    <LegalPage
      eyebrow="Legal"
      title={<>Cookie <span className="gradient-text">Policy</span></>}
      subtitle="How ReviewFlow AI uses cookies and how you can manage them."
      lastUpdated="August 9, 2026"
      sections={sections}
    />
  );
}
