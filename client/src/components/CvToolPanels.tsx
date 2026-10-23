import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Check, FileText, Download } from 'lucide-react';
import { getApiErrorMessage } from '../services/api';
import { Spinner } from './ui/Spinner';
import { downloadCvDocx } from '../lib/cvExport';
import type { AtsOptimizationDto, CoverLetterDto } from '../types/api';

export interface CoverLetterInput {
  jobDescriptionText?: string;
  jobTitle?: string;
  companyName?: string;
}

/*
 * The ATS check and cover letter panels. They take the call to make as a prop, so the same
 * panels work for a saved CV (accounts) and for a file picked on the spot (no account).
 */

// ─── ATS Optimizer ────────────────────────────────────────────────────────────
export function AtsOptimizer({ run: check, fileName, disabled }: {
  run: () => Promise<AtsOptimizationDto>;
  fileName: string;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<AtsOptimizationDto | null>(null);
  const [editedCv, setEditedCv] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await check();
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
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm">ATS Compatibility Score</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Get a score out of 100, find formatting issues that block ATS parsing, and get a suggested rewrite
              you can review and edit.
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || disabled}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-indigo-200"
        >
          {loading ? (
            <><Spinner size="sm" className="text-white" />Analysing CV…</>
          ) : (
            <>{result ? 'Run again' : 'Check my CV'}</>
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
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="rounded-full bg-indigo-100 px-1.5 py-px text-[10px] font-bold text-indigo-700 normal-case tracking-normal">AI</span>
                ATS Score (before rewrite)
              </p>
              <span className={`text-2xl font-black ${scoreColor}`}>{result.score}<span className="text-base font-medium text-slate-400">/100</span></span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${result.score}%` }} />
            </div>
          </div>

          {/* Long CVs: only the first part was sent to the AI, so say so plainly. */}
          {result.cvWasTruncated && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your CV is very long, so only the first part was rewritten. Check the end of the document below
                and add anything that is missing before you download it.
              </p>
            </div>
          )}

          {/* Rewritten CV — editable document */}
          {editedCv && (
            <div className="rounded-2xl border border-indigo-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-indigo-50 border-b border-indigo-100">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">ATS-Optimised CV</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Review and edit below — this is your ready-to-use document</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { navigator.clipboard.writeText(editedCv); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                  >
                    {copied ? <><CheckCircle2 className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                  </button>
                  <button
                    onClick={async () => { setDownloading(true); try { await downloadCvDocx(editedCv, fileName); } finally { setDownloading(false); } }}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {downloading ? <Spinner size="sm" className="text-white" /> : <Download className="h-3.5 w-3.5" />}
                    Download Word
                  </button>
                </div>
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
export function CoverLetterGenerator({ generate: write, disabled }: {
  generate: (input: CoverLetterInput) => Promise<CoverLetterDto>;
  disabled?: boolean;
}) {
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
      const r = await write({
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

        <button onClick={generate} disabled={loading || disabled}
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
