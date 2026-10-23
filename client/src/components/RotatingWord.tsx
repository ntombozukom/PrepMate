import { useEffect, useState } from 'react';

/**
 * Cycles through words in place: each one rolls up from below and snaps into position.
 * Only the current word is rendered, so the slot is exactly as wide as that word. Put it
 * at the end of a centred line and the line re-centres as the word snaps in, with no gaps.
 * Respects "reduce motion" (shows the first word only).
 */
export function RotatingWord({ words, interval = 2200, className = '' }: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    // clip-path (not overflow:hidden) hides the word as it rolls in without moving it off the
    // text baseline, so it lines up with the words before it.
    <span className={`inline-block [clip-path:inset(-0.05em_-0.3em_-0.25em_-0.3em)] ${className}`} aria-live="polite">
      {/* The key change remounts the span, which replays the snap-in animation. */}
      <span key={words[index]} className="inline-block whitespace-nowrap animate-snap-in">
        {words[index]}
      </span>
    </span>
  );
}
