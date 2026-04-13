import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
};

/** Animated sparkle/wand spinner — replaces plain Loader2 throughout the app. */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-wand-spin text-indigo-500', sizes[size], className)}
      aria-hidden="true"
    >
      {/* Centre star */}
      <path
        d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5Z"
        fill="currentColor"
        opacity="1"
      />
      {/* Top-right sparkle */}
      <path
        d="M19 2l.75 2.25L22 5l-2.25.75L19 8l-.75-2.25L16 5l2.25-.75Z"
        fill="currentColor"
        opacity="0.6"
        className="animate-wand-pulse animation-delay-200"
      />
      {/* Bottom-left sparkle */}
      <path
        d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75Z"
        fill="currentColor"
        opacity="0.4"
        className="animate-wand-pulse animation-delay-400"
      />
    </svg>
  );
}
