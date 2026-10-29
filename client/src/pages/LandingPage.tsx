import { Link } from 'react-router-dom';
import { Brain, FileText, Target, ChevronRight, Zap, Users, Trophy, ArrowRight, Check, X, Download, Gauge, Briefcase } from 'lucide-react';
import { useFeatures } from '../hooks/useFeatures';
import { RotatingWord } from '../components/RotatingWord';
import AtsLanding from './AtsLanding';

// ─── Marquee ──────────────────────────────────────────────────────────────────

type Chip = { label: string; color: string };

const row1: Chip[] = [
  { label: 'REST APIs',            color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Microservices',        color: 'bg-violet-100 text-violet-700' },
  { label: 'JWT Authentication',   color: 'bg-blue-100 text-blue-700' },
  { label: 'SOLID Principles',     color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Event Sourcing',       color: 'bg-rose-100 text-rose-700' },
  { label: 'CQRS Pattern',         color: 'bg-amber-100 text-amber-700' },
  { label: 'OAuth 2.0',            color: 'bg-sky-100 text-sky-700' },
  { label: 'Clean Architecture',   color: 'bg-purple-100 text-purple-700' },
  { label: 'PostgreSQL',           color: 'bg-teal-100 text-teal-700' },
  { label: 'Docker & Kubernetes',  color: 'bg-orange-100 text-orange-700' },
  { label: 'CI/CD Pipelines',      color: 'bg-pink-100 text-pink-700' },
  { label: 'GraphQL',              color: 'bg-fuchsia-100 text-fuchsia-700' },
];

const row2: Chip[] = [
  { label: 'Fintech',              color: 'bg-emerald-100 text-emerald-700' },
  { label: 'ACID Transactions',    color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Risk Models',          color: 'bg-rose-100 text-rose-700' },
  { label: 'Basel III',            color: 'bg-blue-100 text-blue-700' },
  { label: 'Healthcare IT',        color: 'bg-teal-100 text-teal-700' },
  { label: 'FHIR Standards',       color: 'bg-sky-100 text-sky-700' },
  { label: 'Payment Processing',   color: 'bg-amber-100 text-amber-700' },
  { label: 'Open Banking',         color: 'bg-violet-100 text-violet-700' },
  { label: 'Actuarial Science',    color: 'bg-purple-100 text-purple-700' },
  { label: 'Capital Markets',      color: 'bg-orange-100 text-orange-700' },
  { label: 'AML Compliance',       color: 'bg-pink-100 text-pink-700' },
  { label: 'Cloud Architecture',   color: 'bg-cyan-100 text-cyan-700' },
];

function MarqueeRow({ chips, reverse = false, speed = 35 }: { chips: Chip[]; reverse?: boolean; speed?: number }) {
  const doubled = [...chips, ...chips];
  return (
    <div className="flex overflow-hidden">
      <div
        className={reverse ? 'animate-marquee-reverse' : 'animate-marquee'}
        style={{ display: 'flex', gap: '12px', animationDuration: `${speed}s` }}
      >
        {doubled.map((chip, i) => (
          <span key={i} className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium ${chip.color}`}>
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  { icon: Brain,    title: 'Plain English Explanations',  desc: 'Complex technical concepts broken down in a way that actually makes sense — without losing the depth.', color: 'bg-violet-100 text-violet-600', delay: 'animation-delay-100' },
  { icon: Target,   title: 'Industry-Tailored Context',   desc: 'Choose Fintech, Banking, Healthcare and more. Every explanation is framed in real scenarios from your sector.', color: 'bg-blue-100 text-blue-600', delay: 'animation-delay-200' },
  { icon: FileText, title: 'CV-Aware Answers',            desc: 'Upload your CV once. PrepMate reads your background and crafts answers that sound like you.', color: 'bg-emerald-100 text-emerald-600', delay: 'animation-delay-300' },
  { icon: Zap,      title: 'Instant Prep Sessions',       desc: 'Paste a job description, pick your industry, and get 10 tailored concept explanations in seconds.', color: 'bg-amber-100 text-amber-600', delay: 'animation-delay-400' },
];

const stats = [
  { icon: Users,  value: 'JD → Concepts', label: 'in under 30 seconds' },
  { icon: Trophy, value: '10 concepts',   label: 'per prep session' },
  { icon: Brain,  value: 'Plain English', label: 'without losing depth' },
];

const steps = [
  { num: '1', label: 'Paste a JD' },
  { num: '2', label: 'Pick your industry' },
  { num: '3', label: 'Upload your CV once' },
];

// ─── ATS-first content (interview prep switched off) ─────────────────────────

const atsFeatures = [
  { icon: Gauge,    title: 'ATS Compatibility Score', desc: 'See how well applicant tracking systems can read your CV, with a score out of 100 and what is working already.', color: 'bg-indigo-100 text-indigo-600', delay: 'animation-delay-100' },
  { icon: Zap,      title: 'Rewritten for ATS',       desc: 'Standard headings, no tables or columns, stronger keywords and action verbs, based on your real experience. Always review it before you use it.', color: 'bg-amber-100 text-amber-600', delay: 'animation-delay-200' },
  { icon: Download, title: 'ATS-friendly Word Download',     desc: 'Review and edit the rewrite, then download a simple single-column Word document.', color: 'bg-emerald-100 text-emerald-600', delay: 'animation-delay-300' },
  { icon: FileText, title: 'Tailored Cover Letters',  desc: 'Paste a job description and get a cover letter built from your CV, in the tone that suits the role.', color: 'bg-violet-100 text-violet-600', delay: 'animation-delay-400' },
];

const atsStats = [
  { icon: Gauge,    value: 'ATS score',      label: 'out of 100, explained' },
  { icon: Download, value: 'Word download',  label: 'single column, ATS-safe' },
  { icon: FileText, value: 'Cover letters',  label: 'tailored to the job' },
];

const atsSteps = [
  { num: '1', label: 'Upload your CV' },
  { num: '2', label: 'See your ATS check' },
  { num: '3', label: 'Download an ATS-friendly version' },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

type PricingRow = { label: string; free: boolean | string; prep: boolean | string; pro: boolean | string };

const pricingRows: PricingRow[] = [
  { label: 'Prep sessions / month',    free: '2',          prep: 'Unlimited',  pro: 'Unlimited' },
  { label: 'Concepts per session',     free: '5',          prep: '10',         pro: '10' },
  { label: 'CV stored',                free: false,        prep: true,         pro: true },
  { label: 'All industries',           free: false,        prep: true,         pro: true },
  { label: 'Session history',          free: '7 days',     prep: 'Forever',    pro: 'Forever' },
  { label: 'AI model',                 free: 'Standard',   prep: 'Standard',   pro: 'Priority (Claude)' },
  { label: 'Concept bookmarks',        free: false,        prep: false,        pro: true },
  { label: 'Export session to PDF',    free: false,        prep: false,        pro: true },
  { label: 'Interview reminders',      free: false,        prep: false,        pro: true },
];

function PricingCell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="mx-auto h-4 w-4 text-indigo-600" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-gray-300" />;
  return <span className="text-sm text-gray-700">{value}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { jobPrep } = useFeatures();
  const heroSteps = jobPrep ? steps : atsSteps;

  // ATS-first launch has its own page; this one is the interview-prep landing.
  if (!jobPrep) return <AtsLanding />;

  return (
    <div className="min-h-screen bg-[#f7f5f0] overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#f7f5f0]/90 backdrop-blur border-b border-gray-100 animate-fade-in-up">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-300">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PrepMate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              Get started <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-200 opacity-30 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute top-16 right-0 h-80 w-80 rounded-full bg-violet-200 opacity-30 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-sky-200 opacity-25 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up animate-float mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span className="rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">AI</span>
            {jobPrep ? 'Interview preparation' : 'CV check for applicant tracking systems'}
          </div>

          <h1 className="animate-fade-in-up animation-delay-100 text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl leading-tight">
            {jobPrep ? 'Walk into every interview' : 'Make your CV easy to read'}
            <span className="block text-indigo-600 mt-1">
              {jobPrep ? 'ready to shine.' : (
                <><span className="font-semibold text-slate-900">for</span> <RotatingWord words={['ATS software.', 'recruiters.', 'hiring managers.']} /></>
              )}
            </span>
          </h1>

          <div className="animate-fade-in-up animation-delay-200 mt-8 space-y-5">
            <p className="text-sm font-medium text-gray-500">
              {heroSteps.map((s) => s.label).join('  ·  ')}
            </p>
            {!jobPrep && (
              <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Many employers screen applications with applicant tracking systems. PrepMate checks how readable
                your CV is for them, suggests fixes and gives you a{' '}
                <span className="font-semibold text-gray-800">ATS-friendly Word version</span> to review, using only{' '}
                <span className="font-semibold text-indigo-600">your actual experience</span>.
              </p>
            )}
            {jobPrep && (
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              PrepMate decodes every technical buzzword into{' '}
              <span className="font-semibold text-gray-800">plain English</span> — crafting answers built around{' '}
              <span className="relative inline-block">
                <span className="relative z-10 font-semibold text-indigo-600">your actual experience</span>
                <span className="absolute bottom-0 left-0 right-0 h-2 bg-indigo-100 rounded-sm -z-0" />
              </span>
              , not a textbook.
            </p>
            )}
          </div>

          <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
            >
              {jobPrep ? 'Start preparing' : 'Check my CV'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee */}
      {jobPrep && (
      <section className="py-12 px-0 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 mb-6 text-center animate-fade-in-up animation-delay-400">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Concepts &amp; industries PrepMate covers
          </p>
        </div>
        <div className="relative space-y-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-white to-transparent" />
          <MarqueeRow chips={row1} speed={38} />
          <MarqueeRow chips={row2} reverse speed={42} />
        </div>
      </section>
      )}

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-10 px-6">
        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {(jobPrep ? stats : atsStats).map((s, i) => (
            <div key={s.value} className={`animate-scale-in animation-delay-${(i + 1) * 100} flex flex-col items-center gap-1 group`}>
              <p className="font-display text-xl font-semibold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900">{jobPrep ? 'Your personal interview coach' : 'What PrepMate does'}</h2>
            <p className="mt-3 text-gray-500 text-lg">{jobPrep ? 'Everything you need to walk in confident.' : 'A clearer CV, in your own words.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {(jobPrep ? features : atsFeatures).map((f, i) => (
              <div key={f.title} className={`animate-fade-in-up ${f.delay} rounded-2xl border border-gray-200 bg-white p-6`}>
                <p className="mb-3 text-xs font-semibold tracking-widest text-indigo-600">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {!jobPrep && (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">Interview prep</h3>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Coming soon</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  Upload a job description and see where your CV is a strong match and where the gaps are. Then get a
                  study guide for the role, from the fundamentals to advanced topics, matched to the level the job expects.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      {jobPrep && (
      <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-4 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900">Simple, honest pricing</h2>
            <p className="mt-3 text-gray-500 text-lg">Choose the plan that matches where you are in your career journey.</p>
          </div>
          <p className="text-center text-xs text-gray-400 mb-12 animate-fade-in-up">All prices in South African Rand (ZAR). Annual billing saves 2 months.</p>

          {/* Tier header cards */}
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div /> {/* label column */}

            {/* Free */}
            <div className="animate-fade-in-up animation-delay-100 rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Free</p>
              <p className="text-3xl font-extrabold text-gray-900">R0</p>
              <p className="text-xs text-gray-400 mt-1">No card needed</p>
              <Link to="/register" className="mt-4 block w-full rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center">
                Get started
              </Link>
            </div>

            {/* Prep */}
            <div className="animate-fade-in-up animation-delay-200 relative rounded-2xl border-2 border-indigo-600 bg-white p-6 text-center shadow-lg shadow-indigo-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white">
                Most popular
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Prep</p>
              <p className="text-3xl font-extrabold text-gray-900">R89</p>
              <p className="text-xs text-gray-400 mt-1">per month · R890/yr</p>
              <Link to="/register" className="mt-4 block w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors text-center">
                Start Prep
              </Link>
            </div>

            {/* Pro */}
            <div className="animate-fade-in-up animation-delay-300 rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Pro</p>
              <p className="text-3xl font-extrabold text-gray-900">R179</p>
              <p className="text-xs text-gray-400 mt-1">per month · R1,790/yr</p>
              <Link to="/register" className="mt-4 block w-full rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center">
                Go Pro
              </Link>
            </div>
          </div>

          {/* Feature rows */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            {pricingRows.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-4 gap-4 px-4 py-3 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                <p className="text-sm text-gray-600">{row.label}</p>
                <div className="text-center"><PricingCell value={row.free} /></div>
                <div className="text-center"><PricingCell value={row.prep} /></div>
                <div className="text-center"><PricingCell value={row.pro} /></div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Not sure? Start on Free, upgrade when you're ready. Downgrade anytime.
          </p>
        </div>
      </section>
      )}

      {/* CTA */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#13233a]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -top-16 -right-16 h-64 w-64 rounded-full bg-violet-400 opacity-30 blur-2xl" />
          <div className="animate-blob animation-delay-2000 absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-400 opacity-30 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="animate-fade-in-up mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-sm font-medium text-white">
            {jobPrep ? 'Your next interview is closer than you think' : 'Free to try'}
          </div>
          <h2 className="animate-fade-in-up animation-delay-100 text-3xl font-bold text-white">
            {jobPrep ? 'Ready to ace your next interview?' : 'See how your CV reads to an ATS'}
          </h2>
          <p className="animate-fade-in-up animation-delay-200 mt-3 text-indigo-200 text-lg">
            {jobPrep ? 'Join PrepMate and walk in knowing your stuff.' : 'Upload your CV and get your check in a few minutes.'}
          </p>
          <Link
            to="/register"
            className="animate-fade-in-up animation-delay-300 mt-8 group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition-all hover:-translate-y-0.5"
          >
            Get started
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} PrepMate. Built to help you succeed.
      </footer>
    </div>
  );
}
