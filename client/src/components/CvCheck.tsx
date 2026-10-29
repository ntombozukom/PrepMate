import { useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, ChevronDown, Copy, Download, FileText, Upload } from 'lucide-react';
import { atsApi, getApiErrorMessage } from '../services/api';
import { downloadCvDocx, downloadCvPdf } from '../lib/cvExport';
import { Spinner } from './ui/Spinner';
import { CvPreview } from './CvPreview';
import type { useCvCheck } from '../hooks/useCvCheck';
import type { AtsRewriteDto, AtsScoreDto, CoverLetterDto } from '../types/api';

/*
 * The one-page CV check: the upload box sits in the landing hero and the results open below it,
 * one step after another (score → rewrite on request → optional cover letter).
 */

type Check = ReturnType<typeof useCvCheck>['check'];

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ─── Upload box (hero) ────────────────────────────────────────────────────────

export function CvUploadBox({ check, turnstileRef }: { check: Check; turnstileRef: React.RefObject<HTMLDivElement | null> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = check.stage === 'reading' || check.stage === 'checking';
  const choose = () => inputRef.current?.click();

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 text-center lg:text-left">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f && !busy) void check.pick(f); }}
        className={`inline-block max-w-full text-left rounded-2xl border-2 border-dashed bg-white px-3 py-2.5 transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void check.pick(f); e.target.value = ''; }} />

        {busy ? (
          <div className="flex items-center justify-center gap-2.5 py-3 text-sm font-medium text-slate-700">
            <Spinner size="sm" />
            {check.stage === 'reading' ? 'Reading your CV…' : 'Checking your CV…'}
          </div>
        ) : check.cv && check.stage === 'done' ? (
          <div className="flex items-center gap-3 py-1">
            <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
            <p className="flex-1 min-w-0 truncate text-left text-sm font-medium text-slate-800">{check.cv.fileName}</p>
            <button onClick={choose} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Check another</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button onClick={choose}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Choose your CV
            </button>
            <span className="text-[13px] text-slate-500">or drop it here</span>
          </div>
        )}

        {/* Turnstile shows a tick box here only if Cloudflare asks for one. */}
        <div ref={turnstileRef} className="flex justify-center" />

        {check.stage === 'failed' && check.error && (
          <div className="mt-3 flex items-start gap-1.5 text-left text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {check.error}{' '}
              {check.cv && <button onClick={check.retry} className="font-semibold underline">Try again</button>}
            </span>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-500 text-center lg:text-left">
        No account needed · PDF or Word · Your file stays on your device
      </p>
    </div>
  );
}

// ─── Results (below the hero) ─────────────────────────────────────────────────

export function CvResults({ check }: { check: Check }) {
  if (!check.cv || !check.score) return null;
  // Keyed on the CV so a new file starts with no rewrite or letter from the last one.
  return <Results key={check.cv.key} cvText={check.cv.text} fileName={check.cv.fileName} score={check.score} />;
}

function Results({ cvText, fileName, score }: { cvText: string; fileName: string; score: AtsScoreDto }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <ScoreCard score={score} />
      <RewriteStep cvText={cvText} fileName={fileName} pass={score.pass} />
      <CoverLetterStep cvText={cvText} pass={score.pass} />
    </div>
  );
}

const card = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 text-left';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors';

function ScoreCard({ score }: { score: AtsScoreDto }) {
  const tone = score.score >= 70 ? 'bg-emerald-500' : score.score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <section className={`${card} animate-fade-in-up`} aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          ATS readability
          <span className="rounded-full bg-indigo-100 px-1.5 py-px font-sans text-[10px] font-bold text-indigo-700">AI</span>
        </h2>
        <p className="font-display text-4xl font-semibold text-slate-900">
          {score.score}<span className="text-base text-slate-400">/100</span>
        </p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${tone}`} style={{ width: `${score.score}%` }} />
      </div>

      {score.cvWasTruncated && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          Your CV is very long, so only the first part was checked.
        </p>
      )}

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <List title="What works" items={score.strengths} icon={<Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />} />
        {score.issues.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What to fix</p>
            <ul className="mt-2 space-y-3">
              {score.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>
                    {issue.text}
                    {issue.quote && (
                      <span className="mt-1 block border-l-2 border-slate-200 pl-2 text-xs text-slate-500">
                        In your CV: “{issue.quote}”
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Nothing important to fix. Nice work.</p>
        )}
      </div>
      <p className="mt-5 text-xs text-slate-400">A guide, not a guarantee. Employers use different systems.</p>
    </section>
  );
}

function List({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">{icon}{s}</li>
        ))}
      </ul>
    </div>
  );
}

function RewriteStep({ cvText, fileName, pass }: { cvText: string; fileName: string; pass: string }) {
  const [result, setResult] = useState<AtsRewriteDto | null>(null);
  const [edited, setEdited] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null);
  const [view, setView] = useState<'preview' | 'edit'>('preview');
  const [open, setOpen] = useState(true);

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await atsApi.rewrite(cvText, pass);
      setResult(r);
      setEdited(r.rewrittenCv);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <section className={`${card} flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in-up animation-delay-100`}>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Want these fixed for you?</h2>
          <p className="mt-1 text-sm text-slate-600">
            We'll rewrite your CV using only what's in it. You can edit everything before you download.
          </p>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
          )}
        </div>
        <button onClick={run} disabled={loading} className={`${primaryBtn} shrink-0`}>
          {loading ? <><Spinner size="sm" className="text-white" />Rewriting… about 20s</> : error ? 'Try again' : 'Rewrite my CV'}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white overflow-hidden text-left animate-fade-in-up">
      <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-indigo-50 ${open ? 'border-b border-indigo-100' : ''}`}>
        <CollapseHeading open={open} onToggle={() => setOpen(!open)} tone="indigo"
          title="Your rewritten CV"
          subtitle={open
            ? 'Preview it, then use Edit text to fill in anything in [square brackets] and check every line is true.'
            : 'Hidden. Your edits are kept.'} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { void navigator.clipboard.writeText(edited); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
            {copied ? <><CheckCircle2 className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
          </button>
          {(['docx', 'pdf'] as const).map((type) => (
            <button key={type}
              onClick={async () => {
                setDownloading(type);
                try { await (type === 'docx' ? downloadCvDocx : downloadCvPdf)(edited, fileName); } finally { setDownloading(null); }
              }}
              disabled={downloading !== null}
              title={type === 'docx' ? 'Word: edit it before you send' : 'PDF: ready to send as is'}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {downloading === type ? <Spinner size="sm" className="text-white" /> : <Download className="h-3.5 w-3.5" />}
              {type === 'docx' ? 'Word' : 'PDF'}
            </button>
          ))}
        </div>
      </div>

      {open && (<>
      {result.unverifiedFigures.length > 0 && (
        <p className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            These figures aren't in your original CV, so check or remove them:{' '}
            <strong>{result.unverifiedFigures.join(', ')}</strong>
          </span>
        </p>
      )}

      {result.cvWasTruncated && (
        <p className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          Your CV is very long, so only the first part was rewritten. Add anything missing from the end before you download it.
        </p>
      )}

      {/* Preview shows the page as the Word and PDF files will look; Edit is the plain text behind it. */}
      <div className="flex items-center gap-1 border-b border-slate-100 px-5 pt-3" role="tablist">
        {(['preview', 'edit'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={`-mb-px border-b-2 px-3 pb-2 text-sm font-semibold transition-colors ${
              view === v ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {v === 'preview' ? 'Preview' : 'Edit text'}
          </button>
        ))}
      </div>

      {view === 'preview' ? (
        <CvPreview cvText={edited} />
      ) : (
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          aria-label="Rewritten CV"
          rows={22}
          spellCheck={false}
          className="w-full p-5 text-sm text-slate-800 font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300"
        />
      )}

      {(result.changes.length > 0 || result.keywordsAdded.length > 0) && (
        <div className="grid gap-6 border-t border-slate-100 p-5 sm:grid-cols-2">
          <List title="What we changed" items={result.changes} icon={<CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />} />
          {result.keywordsAdded.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keywords emphasised</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.keywordsAdded.map((k, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </>)}
    </section>
  );
}

/** A section title that folds its section away; the arrow turns to show which way it will go. */
function CollapseHeading({ open, onToggle, title, subtitle, tone }: {
  open: boolean; onToggle: () => void; title: string; subtitle: string; tone: 'indigo' | 'slate';
}) {
  return (
    <button onClick={onToggle} aria-expanded={open} className="group flex items-start gap-2 text-left">
      <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'} ${
        tone === 'indigo' ? 'text-indigo-600' : 'text-slate-500'}`} />
      <span>
        <span className={`block font-semibold group-hover:underline ${tone === 'indigo' ? 'text-indigo-900' : 'text-slate-900'}`}>{title}</span>
        <span className={`mt-0.5 block text-xs ${tone === 'indigo' ? 'text-indigo-700' : 'text-slate-500'}`}>{subtitle}</span>
      </span>
    </button>
  );
}

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300';

function CoverLetterStep({ cvText, pass }: { cvText: string; pass: string }) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jd, setJd] = useState('');
  const [result, setResult] = useState<CoverLetterDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Once a letter is written the form folds away; "Change details" brings it back.
  const [editing, setEditing] = useState(true);
  const [letterOpen, setLetterOpen] = useState(true);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await atsApi.coverLetter(cvText, pass, {
        jobTitle: jobTitle || undefined, companyName: companyName || undefined, jobDescriptionText: jd || undefined,
      }));
      setEditing(false);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <section className={`${card} flex flex-col sm:flex-row sm:items-center gap-4`}>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Need a cover letter too?</h2>
          <p className="mt-1 text-sm text-slate-600">Written from your CV. Add the job for a better match.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-800 hover:bg-slate-50">
          Write one
        </button>
      </section>
    );
  }

  const target = [jobTitle.trim(), companyName.trim()].filter(Boolean).join(' at ');

  return (
    <section className={`${card} space-y-4 animate-fade-in-up`}>
      {result && !editing ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CollapseHeading open={letterOpen} onToggle={() => setLetterOpen(!letterOpen)} tone="slate"
              title="Your cover letter"
              subtitle={`${target ? `For ${target}` : 'A general letter from your CV'} · ${result.tone} tone`} />
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)}
                className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Change details
              </button>
              <button
                onClick={() => { void navigator.clipboard.writeText(result.coverLetter); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
              </button>
            </div>
          </div>
          {letterOpen && (<>
          {result.unverifiedFigures && result.unverifiedFigures.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                These figures aren't in your CV, so check or remove them:{' '}
                <strong>{result.unverifiedFigures.join(', ')}</strong>
              </span>
            </p>
          )}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            {result.coverLetter.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700">{para.trim()}</p>
            ))}
          </div>
          </>)}
        </>
      ) : (
        <>
          <h2 className="font-semibold text-slate-900">Cover letter</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">Job title (optional)
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Store Manager" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs font-medium text-slate-600">Company (optional)
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Pick n Pay" className={`${input} mt-1`} />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-600">Job ad (optional, for a better match)
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={4} placeholder="Paste the job ad here…"
              className={`${input} mt-1 resize-y leading-relaxed`} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={generate} disabled={loading} className={primaryBtn}>
              {loading ? <><Spinner size="sm" className="text-white" />Writing…</> : result ? 'Write it again' : 'Write my cover letter'}
            </button>
            {result && !loading && (
              <button onClick={() => setEditing(false)} className="text-sm font-semibold text-slate-600 hover:text-slate-800">
                Cancel
              </button>
            )}
          </div>
          {error && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        </>
      )}
    </section>
  );
}
