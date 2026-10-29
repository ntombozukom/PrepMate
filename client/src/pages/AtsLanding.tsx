import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { Logo } from '../components/Logo';
import { RotatingWord } from '../components/RotatingWord';
import { useFeatures } from '../hooks/useFeatures';
import { useCvCheck } from '../hooks/useCvCheck';
import { CvResults, CvUploadBox } from '../components/CvCheck';

/**
 * Landing page while PrepMate launches with the ATS CV check (interview prep switched off).
 * The check runs right here: upload in the hero, results open below it. Kept minimal on purpose.
 */

const features = [
  { title: 'ATS score', desc: 'Out of 100, with what works and what needs attention.' },
  { title: 'Rewrite', desc: 'Built only from what is in your CV. You review every change.' },
  { title: 'Word or PDF', desc: 'A single-column file. Word to edit, PDF to send as is.' },
  { title: 'Cover letters', desc: 'Tailored to the job and your experience.' },
];

const faqs = (accounts: boolean) => [
  {
    q: 'Will this guarantee my CV passes ATS screening?',
    a: 'No. PrepMate checks common readability and formatting issues, but employers use different systems and criteria. The score is a guide, not a ranking.',
  },
  {
    q: 'Will it invent skills or experience?',
    a: 'It works only from what is in your CV. AI can still make mistakes, so you see the full rewrite and can edit it before downloading.',
  },
  accounts
    ? {
        q: 'Is it free?',
        a: 'Yes, while PrepMate is in early access. You need a free account and your CV as a PDF or Word (.docx) file.',
      }
    : {
        q: 'Is it free?',
        a: 'Yes, while PrepMate is in early access. No account is needed, just your CV as a PDF or Word (.docx) file.',
      },
  {
    q: 'What happens to my CV?',
    a: "Your file stays on your device. PrepMate reads the text in your browser and sends only that text to our AI provider, Groq, to produce your results. We don't save it. Groq doesn't use it to train its models, but may keep it in its logs for up to 30 days to keep the service running and stop abuse. Groq stores data in the United States.",
  },
];

/**
 * An illustrative CV (deliberately not an IT role) showing two mistakes most CVs make, fixed in place:
 * a cliché summary and a duty instead of a result. The fix uses a [placeholder] rather than an invented
 * number, which is what the real rewrite does. Tagged "Example" so it is never mistaken for a real assessment.
 */
function ExampleCard() {
  return (
    <figure className="mx-auto w-full max-w-md" aria-hidden="true">
      <div className="relative">
        {/* The CV page (hidden on small phones to keep the page short) */}
        <div className="relative hidden sm:block rounded-xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_-20px_rgba(19,35,58,0.25)]">
          <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Example
          </span>
          <p className="font-display text-xl font-semibold text-slate-900">Lerato Dlamini</p>
          <p className="text-xs text-slate-500">Store Manager · Johannesburg · lerato@example.com</p>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-indigo-700">Summary</p>
          <div className="mt-1 rounded-md bg-indigo-50 px-2 py-1 -mx-2 text-xs leading-relaxed">
            <span className="block text-slate-400 line-through decoration-slate-300">I am a hardworking, honest team player.</span>
            <span className="block font-medium text-indigo-800 animate-highlight-text">
              Store manager with 8 years running busy retail stores.
            </span>
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-700">Experience</p>
          <div className="mt-1 flex items-baseline justify-between text-xs">
            <span className="font-semibold text-slate-800">Store Manager, Sunrise Retail</span>
            <span className="text-slate-400">2018 – present</span>
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            <li>• Opened and closed the store, cash-ups and banking</li>
            <li className="rounded-md bg-indigo-50 px-2 py-1 -mx-2">
              <span className="block text-slate-400 line-through decoration-slate-300">Responsible for a team of 12</span>
              <span className="block font-medium text-indigo-800 animate-highlight-text">
                Led a team of 12,{' '}
                <span className="rounded border border-dashed border-indigo-300 bg-white px-1 font-normal text-indigo-600">
                  add a result
                </span>
              </span>
            </li>
          </ul>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-700">Skills</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {['Team leadership', 'Stock control', 'Customer service', 'Cash handling'].map((k) => (
              <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{k}</span>
            ))}
          </div>
        </div>

        {/* The readability check, over the corner of the page */}
        <div className="sm:absolute sm:-bottom-16 sm:-right-8 w-full sm:w-60 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_16px_40px_-16px_rgba(19,35,58,0.35)]">
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <span className="rounded-full bg-indigo-100 px-1.5 py-px text-[10px] font-bold text-indigo-700">AI</span>
              ATS readability
            </span>
            <span className="font-display text-2xl font-semibold text-slate-900">61<span className="text-xs text-slate-400">/100</span></span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div className="h-1.5 w-[61%] rounded-full bg-amber-400" />
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            {[
              { ok: true, text: 'Contact details found' },
              { ok: true, text: 'Standard headings' },
              { ok: false, text: 'Summary: add role and years' },
              { ok: false, text: 'Duties, not results' },
            ].map((c, i) => (
              <li key={c.text} className="flex items-center gap-2 animate-tick" style={{ animationDelay: `${500 + i * 400}ms` }}>
                {c.ok
                  ? <Check className="h-3.5 w-3.5 text-indigo-600" strokeWidth={2.5} />
                  : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.5} />}
                {c.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Phones see only the score card, so label it there. */}
      <figcaption className="mt-3 text-center text-xs text-slate-400 sm:hidden">Example</figcaption>
      <div className="hidden sm:block h-16" />
    </figure>
  );
}

export default function AtsLanding() {
  const { accounts } = useFeatures();
  const { check, turnstileRef } = useCvCheck();
  const resultsRef = useRef<HTMLElement>(null);
  const hasResults = check.stage === 'done' && !!check.score;

  // Bring the score into view once it arrives.
  useEffect(() => {
    if (hasResults) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hasResults, check.cv?.key]);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">

      {/* Nav */}
      <nav className="px-6">
        <div className="mx-auto max-w-6xl h-16 flex items-center justify-between">
        <Logo tagline />
        {accounts && (
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
        )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-12 pb-14">
        <div className="mx-auto max-w-6xl grid gap-14 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="animate-fade-in-up text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-semibold tracking-tight text-gray-900 leading-[1.05]">
              Make your CV{' '}
              <span className="block text-indigo-600">
                <RotatingWord words={['ATS-friendly.', 'easy to read.', 'recruiter-friendly.']} />
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600 max-w-md mx-auto lg:mx-0">
              Check how well your CV reads, improve what needs attention, and download an editable Word version.
            </p>
            <div className="mt-8">
              <CvUploadBox check={check} turnstileRef={turnstileRef} />
            </div>
          </div>

          {/* On phones the example makes way once there are real results to show. */}
          <div className={`animate-fade-in-up animation-delay-200 ${hasResults ? 'hidden lg:block' : ''}`}>
            <ExampleCard />
          </div>
        </div>
      </section>

      {hasResults && (
        <section ref={resultsRef} className="px-5 sm:px-6 pb-14 scroll-mt-6" aria-label="Your results">
          <CvResults check={check} />
        </section>
      )}

      {/* What you get: one quiet row */}
      <section className="px-6 pb-12">
        <ul className="mx-auto max-w-6xl grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title}>
              <p className="font-semibold text-gray-900">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Questions + coming soon, side by side and collapsed */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqs(accounts).map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="self-start rounded-2xl bg-[#13233a] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Coming soon</p>
            <p className="mt-2 font-display text-2xl font-semibold">Interview prep</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              See where your CV matches a job and where the gaps are, then get a study guide for the role.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} PrepMate.
      </footer>
    </div>
  );
}
