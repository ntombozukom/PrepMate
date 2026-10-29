import { useCallback, useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile, the bot check. It runs only when asked (when a CV is picked) and stays
 * invisible unless Cloudflare wants the visitor to tick a box, which then shows in `container`.
 */

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')));
    s.onerror = () => { loading = null; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(s);
  });
  return loading;
}

export function useTurnstile(container: React.RefObject<HTMLDivElement | null>) {
  const widget = useRef<string | null>(null);
  const pending = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile().then((ts) => {
      if (cancelled || !container.current || widget.current) return;
      widget.current = ts.render(container.current, {
        sitekey: SITE_KEY,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token: string) => { pending.current?.resolve(token); pending.current = null; },
        'error-callback': () => { pending.current?.reject(new Error('Bot check failed')); pending.current = null; },
      });
    }).catch(() => { /* getToken reports it */ });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [container]);

  /** A fresh, single-use token. */
  return useCallback(async (): Promise<string> => {
    if (!SITE_KEY) {
      console.error('VITE_TURNSTILE_SITE_KEY is not set. Run with --mode cfdev locally, or set it in the Cloudflare build settings.');
      throw new Error('Bot check not configured');
    }
    const ts = await loadTurnstile();
    for (let i = 0; i < 50 && !widget.current; i++) await new Promise((r) => setTimeout(r, 100));
    const id = widget.current;
    if (!id) throw new Error('Bot check not ready');

    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      ts.reset(id);
      ts.execute(id);
      setTimeout(() => {
        if (pending.current?.resolve === resolve) { pending.current = null; reject(new Error('Bot check timed out')); }
      }, 60_000);
    });
  }, []);
}
