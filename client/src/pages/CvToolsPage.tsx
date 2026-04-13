import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LogOut, Wrench, BookOpen, ArrowLeft, Briefcase, LayoutDashboard,
  AlertCircle, CheckCircle2, Copy, Check, FileText, Zap,
} from 'lucide-react';
import { cvApi, cvToolsApi, getApiErrorMessage } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import type { AtsOptimizationDto, CoverLetterDto } from '../types/api';

type Tab = 'ats' | 'cover-letter';

// ─── ATS Optimizer ────────────────────────────────────────────────────────────
function AtsOptimizer({ cvId }: { cvId: string }) {
  const [result, setResult] = useState<AtsOptimizationDto | null>(null);
  const [editedCv, setEditedCv] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await cvToolsApi.optimizeAts(cvId);
      setResult(r);
      setEditedCv(r.rewrittenCv ?? '');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    !result ? '' :
    result.score >= 70 ? 'text-emerald-600' :
    result.score >= 50 ? 'text-amber-600' : 'text-red-500';
  const barColor =
    !result ? '' :
    result.score >= 70 ? 'bg-emerald-500' :
    result.score >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Zap className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm">ATS Compatibility Score</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Get a score out of 100, find formatting issues that block ATS parsing, and get a rewritten summary
              section packed with the right keywords.
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-indigo-200"
        >
          {loading ? (
            <><Spinner size="sm" className="text-white" />Analysing CV…</>
          ) : (
            <><Zap className="h-4 w-4" />{result ? 'Re-run Analysis' : 'Analyse CV'}</>
          )}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Score bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ATS Score (before rewrite)</p>
              <span className={`text-2xl font-black ${scoreColor}`}>{result.score}<span className="text-base font-medium text-slate-400">/100</span></span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${result.score}%` }} />
            </div>
          </div>

          {/* Rewritten CV — editable document */}
          {editedCv && (
            <div className="rounded-2xl border border-indigo-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-indigo-50 border-b border-indigo-100">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">ATS-Optimised CV</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Review and edit below — this is your ready-to-use document</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(editedCv); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
                >
                  {copied ? <><CheckCircle2 className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                </button>
              </div>
              <textarea
                value={editedCv}
                onChange={e => setEditedCv(e.target.value)}
                className="w-full p-5 text-sm text-slate-800 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300"
                rows={28}
                spellCheck={false}
              />
            </div>
          )}

          {/* What changed */}
          {result.improvements.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-3">What Was Changed</p>
              <ul className="space-y-2">
                {result.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What's working */}
          {result.strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-3">What Was Already Working</p>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords added */}
          {result.keywordsToAdd.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Keywords Added / Emphasised</p>
              <div className="flex flex-wrap gap-2">
                {result.keywordsToAdd.map((kw, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cover Letter Generator ───────────────────────────────────────────────────
function CoverLetterGenerator({ cvId }: { cvId: string }) {
  const [jdText, setJdText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [result, setResult] = useState<CoverLetterDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await cvToolsApi.generateCoverLetter({
        cvDocumentId: cvId,
        jobDescriptionText: jdText || undefined,
        jobTitle: jobTitle || undefined,
        companyName: companyName || undefined,
      });
      setResult(r);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Cover Letter Generator</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Generates a personalised cover letter from your CV. Add a job description for a targeted letter.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Job Title (optional)</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Engineer"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Company (optional)</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Capitec Bank"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Job Description (optional — for a targeted letter)</label>
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description here for a highly targeted cover letter…"
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none leading-relaxed transition" />
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-indigo-200">
          {loading ? (
            <><Spinner size="sm" className="text-white" />Writing cover letter…</>
          ) : (
            <><FileText className="h-4 w-4" />{result ? 'Regenerate' : 'Generate Cover Letter'}</>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover Letter</p>
              <p className="text-xs text-indigo-500 mt-0.5">{result.tone} tone</p>
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
          </div>
          <div className="space-y-3">
            {result.coverLetter.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">{para.trim()}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CvToolsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('ats');

  const { data: activeCv, isLoading: cvLoading } = useQuery({
    queryKey: ['cv', 'active'],
    queryFn: cvApi.getActive,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">PrepMate</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>

          <Link to="/dashboard"
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>

          <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium bg-indigo-50 text-indigo-700">
            <Wrench className="h-4 w-4 shrink-0" />
            CV Tools
          </button>

          <Link to="/dashboard"
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <BookOpen className="h-4 w-4 shrink-0" />
            Sessions
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="h-7 w-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-13">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">PrepMate</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 px-5 py-8 mt-13 lg:mt-0 max-w-2xl mx-auto w-full">

        <div className="animate-fade-in-up mb-6">
          <h1 className="text-xl font-bold text-slate-900">CV Tools</h1>
          <p className="mt-0.5 text-sm text-slate-500">Make your CV work harder for you.</p>
        </div>

        {/* No CV warning */}
        {!cvLoading && !activeCv && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 mb-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">No CV uploaded</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Upload your CV on the{' '}
                <Link to="/dashboard" className="underline font-medium">Dashboard</Link>
                {' '}first to use CV Tools.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="animate-fade-in-up animation-delay-100">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-5">
            {([['ats', 'ATS Optimiser'], ['cover-letter', 'Cover Letter']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t === 'ats' ? <Zap className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {cvLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
              <Spinner size="sm" className="text-white" /> Loading…
            </div>
          )}

          {!cvLoading && activeCv && (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500">Using CV: <span className="font-medium text-slate-700">{activeCv.fileName}</span></p>
                <Link to="/dashboard" className="ml-auto text-xs text-indigo-500 hover:text-indigo-600 font-medium">Replace</Link>
              </div>

              {tab === 'ats' && <AtsOptimizer cvId={activeCv.id} />}
              {tab === 'cover-letter' && <CoverLetterGenerator cvId={activeCv.id} />}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
