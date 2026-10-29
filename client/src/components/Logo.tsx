import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';

/**
 * PrepMate wordmark: a handshake that shakes (on load and on hover) next to the name,
 * with "Mate" in the serif italic giving a small nod at the same time.
 */

const sizes = {
  md: { tile: 'h-10 w-10 rounded-xl', icon: 'h-6 w-6', text: 'text-2xl' },
  sm: { tile: 'h-8 w-8 rounded-lg', icon: 'h-5 w-5', text: 'text-lg' },
};

function Mark({ size }: { size: keyof typeof sizes }) {
  const s = sizes[size];
  return (
    <span className={`flex shrink-0 items-center justify-center bg-indigo-600 ${s.tile}`}>
      <Handshake className={`logo-shake text-white ${s.icon}`} strokeWidth={2} />
    </span>
  );
}

export function Logo({ to = '/', tagline = false, size = 'md' }: {
  to?: string; tagline?: boolean; size?: keyof typeof sizes;
}) {
  return (
    <Link to={to} className="logo group inline-flex items-center gap-2.5" aria-label="PrepMate home">
      <Mark size={size} />
      <span className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-gray-900 ${sizes[size].text}`}>
          Prep<span className="logo-nod inline-block font-display italic font-semibold text-indigo-600">Mate</span>
        </span>
        {tagline && (
          <span className="mt-1 text-[11px] font-medium text-slate-500">A clearer CV. A stronger application.</span>
        )}
      </span>
    </Link>
  );
}

/** Icon only, for the collapsed sidebar. */
export function LogoMark({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo group" aria-label="PrepMate home">
      <Mark size="sm" />
    </Link>
  );
}
