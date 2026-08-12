import type { ReactNode } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

export function PublicPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <LandingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
