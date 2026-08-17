import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-google-blue to-[#1a73e8] flex items-center justify-center shadow-glow-blue transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-google-yellow ring-2 ring-white" />
      </div>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-ink-800">
          ReviewFlow<span className="text-google-blue"> AI</span>
        </span>
      )}
    </Link>
  );
}
