import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-google-blue to-[#1a73e8] text-white shadow-[0_4px_14px_-2px_rgba(66,133,244,0.45)] hover:shadow-[0_8px_24px_-4px_rgba(66,133,244,0.55)]',
  secondary:
    'bg-ink-800 text-white shadow-soft hover:bg-ink-700',
  ghost: 'text-ink-700 hover:bg-ink-100',
  outline: 'border border-ink-300 text-ink-800 hover:border-ink-400 hover:bg-ink-50',
  danger: 'bg-gradient-to-r from-google-red to-[#d33426] text-white shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5 py-3.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, className = '', children, onClick, loading = false, disabled, ...props }, ref) => {
    const rippleRef = useRef<HTMLSpanElement | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const rect = btn.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
      circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
      circle.style.position = 'absolute';
      circle.style.borderRadius = '9999px';
      circle.style.background = 'rgba(255,255,255,0.45)';
      circle.style.pointerEvents = 'none';
      circle.style.transform = 'scale(0)';
      circle.style.opacity = '1';
      circle.animate(
        [{ transform: 'scale(0)', opacity: 0.6 }, { transform: 'scale(2.5)', opacity: 0 }],
        { duration: 600, easing: 'ease-out' },
      );
      rippleRef.current?.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`relative inline-flex items-center justify-center rounded-xl font-semibold overflow-hidden select-none transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      disabled={loading || disabled}
      >
        <span ref={rippleRef} className="absolute inset-0 overflow-hidden rounded-xl" />
        {loading ? (
          <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="relative z-10 flex items-center">{leftIcon}</span>}
            <span className="relative z-10">{children}</span>
            {rightIcon && <span className="relative z-10 flex items-center">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';
