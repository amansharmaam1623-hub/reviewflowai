import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { PageHeader } from '@/components/public/PageHeader';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({ eyebrow, title, subtitle, sections, lastUpdated }: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  sections: LegalSection[];
  lastUpdated?: string;
}) {
  return (
    <PublicPageLayout>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4">
          {lastUpdated && (
            <p className="text-sm text-ink-400 mb-8">Last updated: {lastUpdated}</p>
          )}

          <div className="space-y-10">
            {sections.map((s, i) => (
              <motion.div
                key={s.heading}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
              >
                <h2 className="text-xl font-bold text-ink-800 mb-3">{s.heading}</h2>
                <div className="text-sm text-ink-600 leading-relaxed space-y-3">
                  {s.body}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
