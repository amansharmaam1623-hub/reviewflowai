import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy-policy' },
      { label: 'Terms', to: '/terms-of-service' },
      { label: 'Cookies', to: '/cookie-policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-ink-500 leading-relaxed max-w-xs">
              AI-powered Google review management for local businesses that care about their reputation.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-lg bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition-colors"
                >
                  <Icon className="h-4 w-4 text-ink-600" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-ink-800 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-ink-500 hover:text-ink-800 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-ink-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-500">© 2026 ReviewFlow AI. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-google-green animate-pulse-soft" />
            <span className="text-sm text-ink-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
