import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';
import { CTASection } from '@/components/public/CTASection';
import { FAQAccordion, type FAQItem } from '@/components/public/FAQAccordion';
import { usePageMeta } from '@/lib/usePageMeta';

const faqs: FAQItem[] = [
  {
    q: 'What is ReviewFlow AI?',
    a: 'ReviewFlow AI is an AI-powered reputation management platform that helps local businesses collect more Google reviews, respond to them intelligently, and track their online reputation — all from one dashboard.',
  },
  {
    q: 'How does ReviewFlow AI work?',
    a: 'You connect your Google Business Profile, generate a branded QR code, and place it where customers can scan it. When they scan it, our AI creates three personalized review drafts. The customer picks one, edits if they like, and posts directly to Google — all in under a minute.',
  },
  {
    q: 'Can ReviewFlow AI generate review responses?',
    a: 'Yes. Our AI analyzes each review and suggests a professional, context-aware response. This works for both positive and negative reviews, saving you time while keeping your responses thoughtful and on-brand.',
  },
  {
    q: 'How do I collect more Google reviews?',
    a: 'Place your ReviewFlow QR code at your counter, on receipts, in packaging, or anywhere customers interact with your business. The frictionless scan-and-post flow removes the barriers that stop most customers from leaving reviews.',
  },
  {
    q: 'What is the QR Code used for?',
    a: 'The QR code links directly to your AI-powered review flow. When a customer scans it with their phone camera, they land on a mobile page that generates review suggestions for them — no app download or account creation needed.',
  },
  {
    q: 'Can I manage multiple businesses?',
    a: 'Yes. The Starter plan supports 1 business location, Professional supports up to 3, and Enterprise supports unlimited locations. Each location gets its own QR codes, analytics, and settings.',
  },
  {
    q: 'Is my business data secure?',
    a: 'Your data is stored securely using industry-standard encryption. We never share your business information with third parties, and you can export or delete your data at any time from your dashboard settings.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel or downgrade your plan at any time from your dashboard. There are no long-term contracts or cancellation fees. Your subscription remains active until the end of the current billing period.',
  },
  {
    q: 'Do I need technical knowledge?',
    a: 'Not at all. ReviewFlow AI is designed for business owners, not developers. Setup takes about two minutes, and the dashboard is intuitive and straightforward. If you can scan a QR code, you can use ReviewFlow.',
  },
  {
    q: 'How does the AI review suggestion work?',
    a: 'When a customer scans your QR code, our AI analyzes your business category, name, and customer experience signals to generate three personalized review drafts. The customer chooses the one that best matches their experience, can edit it, and posts it to Google.',
  },
];

export function FAQPage() {
  usePageMeta(
    'FAQ | ReviewFlow AI',
    'Frequently asked questions about ReviewFlow AI. Learn how it works, AI review responses, QR codes, multiple businesses, security, cancellation, and more.',
  );

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrow="FAQ"
        title={<>Questions? <span className="gradient-text">We have answers</span></>}
        subtitle="Everything you need to know about ReviewFlow AI. Can't find what you're looking for? Reach out to our team."
      />

      <section className="py-12 md:py-16 bg-ink-50/60">
        <div className="mx-auto max-w-3xl px-4">
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <CTASection
        title="Still have questions?"
        subtitle="Our team is happy to help. Get started free or reach out anytime."
        secondaryLabel="Contact us"
        secondaryTo="/contact"
      />
    </PublicPageLayout>
  );
}
