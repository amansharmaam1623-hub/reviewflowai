import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'red' | 'yellow' | 'green' | 'gray';
  className?: string;
}

const colors = {
  blue: 'bg-google-blue/10 text-google-blue',
  red: 'bg-google-red/10 text-google-red',
  yellow: 'bg-google-yellow/20 text-[#a86e00]',
  green: 'bg-google-green/10 text-google-green',
  gray: 'bg-ink-100 text-ink-600',
};

export function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
