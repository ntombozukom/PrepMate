import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut, FileText, Upload, ChevronDown, ChevronUp,
  Briefcase, Calendar, CheckCircle2, AlertCircle,
  Plus, BookOpen, X, ArrowRight, ChevronRight, ArrowLeft,
  BarChart2, Wrench, AlertTriangle, TrendingUp, ShieldAlert,
  PanelLeftClose, PanelLeftOpen, User, LayoutDashboard,
} from 'lucide-react';
import { cvApi, cvToolsApi, jdApi, prepSessionApi, getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Industry, IndustryLabels, DifficultyColors,
  type PrepSessionDetailDto, type CvMatchResultDto,
} from '../types/api';
import { Spinner } from '../components/ui/Spinner';

// ─── Industry config ──────────────────────────────────────────────────────────
const industryColor: Record<string, string> = {
  Fintech: 'bg-emerald-100 text-emerald-700',
  Banking: 'bg-blue-100 text-blue-700',
  Healthcare: 'bg-rose-100 text-rose-700',
  'E-Commerce': 'bg-amber-100 text-amber-700',
  Insurance: 'bg-violet-100 text-violet-700',
  Telecommunications: 'bg-cyan-100 text-cyan-700',
  Retail: 'bg-orange-100 text-orange-700',
  Logistics: 'bg-teal-100 text-teal-700',
  Education: 'bg-sky-100 text-sky-700',
  'General Software': 'bg-indigo-100 text-indigo-700',
};

const industryOptions = Object.entries(IndustryLabels).map(([value, label]) => ({
  value: Number(value) as Industry,
  label,
}));

// ─── Markdown-ish block renderer ──────────────────────────────────────────────
function isTableBlock(text: string) {
  return text.trimStart().startsWith('|') && text.includes('\n');
}

function isCodeBlock(text: string) {
  return /^(public|private|protected|internal|var |await |\/\/|using |class |interface |namespace |return |if \(|for\()/.test(text.trimStart());
}

function RenderTable({ raw }: { raw: string }) {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
  if (lines.length < 2) return <pre className="rounded-xl bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto font-mono leading-relaxed">{raw.trim()}</pre>;

  const parseRow = (line: string) =>
    line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

  const isSep = (line: string) => /^[\s|:\-]+$/.test(line);
  const headers = parseRow(lines[0]);
  const dataLines = lines.slice(1).filter(l => !isSep(l));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap border-b border-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {dataLines.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/60">
              {parseRow(row).map((cell, ci) => (
                <td key={ci} className={`px-3.5 py-2.5 text-slate-700 leading-snug align-top ${ci === 0 ? 'font-semibold whitespace-nowrap' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function highlightCsharp(code: string): React.ReactNode[] {
  // tokenize line by line to preserve structure
  return code.split('\n').map((line, li) => {
    // process each token type in order
    const tokens: { text: string; cls: string }[] = [];
    let remaining = line;
    let safety = 0;
    while (remaining.length > 0 && safety++ < 500) {
      // try each pattern
      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) { tokens.push({ text: commentMatch[1], cls: 'text-slate-400 italic' }); break; }

      const strMatch = remaining.match(/^(["'][^"'\\]*["'])/);
      if (strMatch) { tokens.push({ text: strMatch[1], cls: 'text-amber-300' }); remaining = remaining.slice(strMatch[1].length); continue; }

      const kwMatch = remaining.match(/^(public|private|protected|internal|static|sealed|abstract|override|virtual|readonly|const|class|interface|record|enum|struct|namespace|using|new|return|if|else|for|foreach|while|switch|case|break|continue|throw|try|catch|finally|await|async|var|void|get|set|init|null|true|false|this|base)(?=\W|$)/);
      if (kwMatch) { tokens.push({ text: kwMatch[1], cls: 'text-purple-400 font-semibold' }); remaining = remaining.slice(kwMatch[1].length); continue; }

      const typeMatch = remaining.match(/^(string|int|decimal|bool|Guid|Task|List|IEnumerable|IReadOnlyList|DateTime|DateOnly|object|Exception)(?=\W|$)/);
      if (typeMatch) { tokens.push({ text: typeMatch[1], cls: 'text-cyan-300' }); remaining = remaining.slice(typeMatch[1].length); continue; }

      const numMatch = remaining.match(/^(\d+(?:\.\d+)?m?)/);
      if (numMatch) { tokens.push({ text: numMatch[1], cls: 'text-orange-300' }); remaining = remaining.slice(numMatch[1].length); continue; }

      // consume one char
      tokens.push({ text: remaining[0], cls: '' });
      remaining = remaining.slice(1);
    }
    return (
      <span key={li}>
        {tokens.map((t, ti) => t.cls ? <span key={ti} className={t.cls}>{t.text}</span> : t.text)}
        {'\n'}
      </span>
    );
  });
}

function RenderBlocks({ text }: { text: string }) {
  const blocks = text.split('\n\n').filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (isTableBlock(trimmed)) return <RenderTable key={i} raw={trimmed} />;
        if (isCodeBlock(trimmed)) return (
          <pre key={i} className="rounded-xl bg-[#1e1e2e] text-slate-100 text-xs p-4 overflow-x-auto font-mono leading-relaxed">
            {highlightCsharp(trimmed)}
          </pre>
        );
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
}

// ─── Concept card ─────────────────────────────────────────────────────────────
function ConceptCard({ concept, index }: { concept: PrepSessionDetailDto['concepts'][0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}>
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50/60 transition-colors">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 leading-snug">{concept.topic}</p>
            <p className="mt-0.5 text-sm text-gray-500 leading-snug line-clamp-1">{concept.question}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DifficultyColors[concept.difficultyName] ?? 'bg-gray-100 text-gray-600'}`}>
            {concept.difficultyName}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-5 space-y-5">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1.5">Plain English</p>
            <p className="text-sm text-gray-700 leading-relaxed">{concept.plainEnglishExplanation}</p>
          </div>
          {concept.analogy && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3.5 flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Think of it as</p>
                <p className="text-sm text-amber-900 leading-relaxed italic">{concept.analogy}</p>
              </div>
            </div>
          )}
          {concept.technicalDepth && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">Technical Depth</p>
              <RenderBlocks text={concept.technicalDepth} />
            </div>
          )}
          {concept.industryContext && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">Industry Context</p>
              <p className="text-sm text-gray-700 leading-relaxed">{concept.industryContext}</p>
            </div>
          )}
          {concept.suggestedAnswer && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2.5">Say this out loud</p>
              <div className="space-y-3">
                {concept.suggestedAnswer.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-indigo-900 leading-relaxed">{para.trim()}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Match Analysis Panel ─────────────────────────────────────────────────────
function MatchPanel({
  match, onGenerate, generating, sessionError,
}: {
  match: CvMatchResultDto;
  onGenerate: () => void;
  generating: boolean;
  sessionError: string;
}) {
  const [proceeding, setProceeding] = useState(false);
  const isWeak = match.overallMatch === 'Weak';
  const scoreColor = match.matchScore >= 70 ? 'text-emerald-600' : match.matchScore >= 40 ? 'text-amber-600' : 'text-red-500';
  const barColor   = match.matchScore >= 70 ? 'bg-emerald-500' : match.matchScore >= 40 ? 'bg-amber-400' : 'bg-red-400';
  const badgeColor = match.overallMatch === 'Strong'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : match.overallMatch === 'Medium'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-600 border-red-200';

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Skills Match</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-black ${scoreColor}`}>{match.matchScore}%</span>
              <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-semibold ${badgeColor}`}>
                {match.overallMatch}
              </span>
            </div>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <BarChart2 className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${match.matchScore}%` }} />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{match.experienceAlignment}</p>
        {match.recommendation && (
          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3.5">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Coach says</p>
            <p className="text-sm text-indigo-900 leading-relaxed">{match.recommendation}</p>
          </div>
        )}
      </div>

      {/* Skills grid */}
      {(match.matchedSkills.length > 0 || match.skillGaps.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {match.matchedSkills.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-800">Matched Skills</p>
                <span className="ml-auto text-xs text-slate-400">{match.matchedSkills.length}</span>
              </div>
              <div className="space-y-2.5">
                {match.matchedSkills.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <span className={`mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.strength === 'Strong' ? 'bg-emerald-100 text-emerald-700' :
                      s.strength === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>{s.strength}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{s.skill}</p>
                      {s.evidence && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{s.evidence}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {match.skillGaps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-slate-800">Skill Gaps</p>
                <span className="ml-auto text-xs text-slate-400">{match.skillGaps.length}</span>
              </div>
              <div className="space-y-2.5">
                {match.skillGaps.map((g, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-800">{g.skill}</p>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        g.importance === 'High' ? 'bg-red-100 text-red-600' :
                        g.importance === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>{g.importance}</span>
                    </div>
                    {g.tip && <p className="text-xs text-slate-500 leading-snug">{g.tip}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weak match warning */}
      {isWeak && !proceeding && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Weak match detected</p>
              <p className="mt-1.5 text-sm text-amber-700 leading-relaxed">
                Your CV shows a weak match for this role. The session will still cover everything from basics to expert level — but you may want to strengthen your profile first.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => setProceeding(true)}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
                  Proceed anyway
                </button>
                <span className="text-sm text-amber-600">or update your CV above</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate */}
      {(!isWeak || proceeding) && (
        <div>
          {sessionError && (
            <p className="mb-3 text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {sessionError}
            </p>
          )}
          <button onClick={onGenerate} disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0">
            {generating ? (
              <><Spinner size="sm" className="text-white" />Generating session… this takes ~30s</>
            ) : (
              <>Generate Prep Session<ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step, cvReady, jdReady }: { step: number; cvReady: boolean; jdReady: boolean }) {
  const steps = [
    { label: 'Your CV', done: cvReady && step > 1 },
    { label: 'Job Description', done: jdReady && step > 2 },
    { label: 'Match & Generate', done: false },
  ];
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
              s.done ? 'bg-emerald-500 text-white' :
              step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium truncate hidden sm:block ${
              step === i + 1 ? 'text-slate-900' : s.done ? 'text-emerald-600' : 'text-slate-400'
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-3 flex-1 h-px min-w-[16px] transition-colors ${step > i + 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed, onToggle, sessions, user, onSignOut,
}: {
  collapsed: boolean;
  onToggle: () => void;
  sessions: { length: number };
  user: { firstName?: string; lastName?: string; email?: string } | null;
  onSignOut: () => void;
}) {
  const initial = user?.firstName?.[0]?.toUpperCase() ?? '?';

  return (
    <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-slate-100 h-16 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">PrepMate</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${collapsed ? 'hidden' : ''}`}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>}

        <NavItem collapsed={collapsed} icon={<LayoutDashboard className="h-4 w-4 shrink-0" />} label="Dashboard" active href="/dashboard" />
        <NavItem collapsed={collapsed} icon={<Wrench className="h-4 w-4 shrink-0" />} label="CV Tools" href="/cv-tools" />
        <NavItem
          collapsed={collapsed}
          icon={<BookOpen className="h-4 w-4 shrink-0" />}
          label="Sessions"
          href="/dashboard"
          badge={sessions.length > 0 ? sessions.length : undefined}
        />
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 px-2 py-3 space-y-1">
        <Link to="/profile" className={`flex items-center rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-7 w-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* Expand toggle (shown only when collapsed) */}
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

function NavItem({ collapsed, icon, label, active, href, badge }: {
  collapsed: boolean; icon: React.ReactNode; label: string;
  active?: boolean; href: string; badge?: number;
}) {
  return (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {icon}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const cvInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [step, setStep] = useState(1);
  const [cvDragOver, setCvDragOver] = useState(false);
  const [jdDragOver, setJdDragOver] = useState(false);
  const [jdMode, setJdMode] = useState<'upload' | 'paste'>('upload');
  const [jdText, setJdText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<Industry>(Industry.GeneralSoftware);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [matchResult, setMatchResult] = useState<CvMatchResultDto | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [activeSession, setActiveSession] = useState<PrepSessionDetailDto | null>(null);
  const [sessionError, setSessionError] = useState('');

  const { data: activeCv, isLoading: cvLoading } = useQuery({
    queryKey: ['cv', 'active'],
    queryFn: cvApi.getActive,
    retry: false,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['prep-sessions'],
    queryFn: prepSessionApi.getAll,
  });

  const { mutate: uploadCv, isPending: cvUploading, error: cvError } = useMutation({
    mutationFn: cvApi.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cv', 'active'] }),
  });

  const { mutate: createSession, isPending: generating } = useMutation({
    mutationFn: prepSessionApi.create,
    onSuccess: (session) => {
      setActiveSession(session);
      setSessionError('');
      queryClient.invalidateQueries({ queryKey: ['prep-sessions'] });
      setTimeout(() => sessionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    },
    onError: (err) => setSessionError(getApiErrorMessage(err)),
  });

  // Auto-analyze JD
  useEffect(() => {
    if (jdText.length < 150 || analyzed || analyzing) return;
    const timer = setTimeout(async () => {
      setAnalyzing(true); setAnalyzeError('');
      try {
        const result = await jdApi.analyzeJd(jdText);
        setJobTitle(result.jobTitle ?? ''); setCompanyName(result.companyName ?? '');
        setIndustry(result.industry ?? Industry.GeneralSoftware); setAnalyzed(true);
      } catch { setAnalyzeError('Could not auto-detect fields — please fill in manually.'); }
      finally { setAnalyzing(false); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [jdText, analyzed, analyzing]);

  // Auto-run match when entering step 3
  useEffect(() => {
    if (step !== 3 || !activeCv || jdText.length < 100 || !jobTitle.trim() || matchResult || matchLoading) return;
    const run = async () => {
      setMatchLoading(true); setMatchError('');
      try {
        const r = await cvToolsApi.analyzeMatch({ cvDocumentId: activeCv.id, jobDescriptionText: jdText, jobTitle: jobTitle.trim() });
        setMatchResult(r);
      } catch { setMatchError('Could not run match analysis. You can still generate your session.'); }
      finally { setMatchLoading(false); }
    };
    run();
  }, [step, activeCv, jdText, jobTitle, matchResult, matchLoading]);

  const handleCvFile = (file: File) => {
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) return;
    uploadCv(file);
  };

  const handleJdFile = async (file: File) => {
    setExtracting(true); setAnalyzed(false);
    try { setJdText(await jdApi.extractText(file)); } catch { /* silent */ } finally { setExtracting(false); }
  };

  const handleGenerate = () => {
    if (!activeCv || !jobTitle.trim() || jdText.length < 100) return;
    setSessionError('');
    createSession({ cvDocumentId: activeCv.id, jobDescriptionText: jdText, jobTitle: jobTitle.trim(), companyName: companyName.trim() || undefined, industry });
  };

  const resetSession = () => {
    setActiveSession(null); setMatchResult(null); setJdText(''); setJobTitle('');
    setCompanyName(''); setIndustry(Industry.GeneralSoftware); setAnalyzed(false);
    setAnalyzeError(''); setSessionError(''); setStep(1);
  };

  const cvReady  = !!activeCv;
  const jdReady  = jdText.length >= 100;
  const canStep3 = jdReady && jobTitle.trim().length > 0 && !analyzing;
  const pastSessions = activeSession ? sessions.filter((s) => s.id !== activeSession.id) : sessions;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        sessions={sessions}
        user={user}
        onSignOut={() => { logout(); navigate('/'); }}
      />

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">PrepMate</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/cv-tools" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <Wrench className="h-3.5 w-3.5" /><span className="hidden sm:inline">CV Tools</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <User className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">

          {/* Greeting */}
          <div className="animate-fade-in-up mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting()}, <span className="text-indigo-600">{user?.firstName}</span>
            </h1>
            <p className="mt-1 text-slate-500">
              {sessions.length === 0
                ? "Let's get you ready for your next interview."
                : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} completed. Keep sharpening.`}
            </p>
          </div>

          {/* ── Stepper + steps ── */}
          {!activeSession && (
            <div className="animate-fade-in-up animation-delay-100">
              <Stepper step={step} cvReady={cvReady} jdReady={jdReady} />

              {/* Step 1: CV */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className={`rounded-2xl border bg-white ${cvReady ? 'border-emerald-200' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between px-6 pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${cvReady ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                          {cvReady ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                        </div>
                        <span className="font-semibold text-slate-900">Your CV</span>
                        {cvLoading && (
                          <span className="text-sm text-slate-400">Checking…</span>
                        )}
                        {cvReady && (
                          <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            {activeCv!.fileName}
                          </span>
                        )}
                      </div>
                      {cvReady && (
                        <button onClick={() => cvInputRef.current?.click()}
                          className="text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium">
                          Replace
                        </button>
                      )}
                    </div>

                    {cvLoading ? (
                      <div className="mx-6 mb-6 flex flex-col items-center gap-3 py-14">
                        <Spinner size="lg" />
                        <p className="text-sm text-slate-400">Loading your CV…</p>
                      </div>
                    ) : !cvReady && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setCvDragOver(true); }}
                        onDragLeave={() => setCvDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setCvDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCvFile(f); }}
                        onClick={() => cvInputRef.current?.click()}
                        className={`mx-6 mb-6 rounded-xl border-2 border-dashed cursor-pointer px-8 py-14 text-center transition-all ${cvDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                      >
                        {cvUploading ? (
                          <div className="flex flex-col items-center gap-3">
                            <Spinner size="lg" />
                            <p className="text-slate-500">Uploading…</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                              <Upload className="h-7 w-7 text-indigo-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Drop your CV here or click to browse</p>
                              <p className="text-sm text-slate-400 mt-1">PDF, DOCX or TXT — uploaded once, reused everywhere</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {cvError && (
                      <p className="px-6 pb-4 text-sm text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> {getApiErrorMessage(cvError)}
                      </p>
                    )}
                  </div>

                  <input ref={cvInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvFile(f); e.target.value = ''; }} />

                  {cvReady && (
                    <button onClick={() => setStep(2)}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-indigo-200">
                      Next: Add Job Description <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: JD */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 px-6 pt-5 pb-4">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${jdReady ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                        {jdReady ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                      </div>
                      <span className="font-semibold text-slate-900">Job Description</span>
                    </div>

                    <div className="px-6 pb-4">
                      <div className="inline-flex rounded-lg bg-slate-100 p-1">
                        {(['upload', 'paste'] as const).map((mode) => (
                          <button key={mode} onClick={() => setJdMode(mode)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${jdMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {mode === 'upload' ? 'Upload file' : 'Paste text'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {jdMode === 'upload' ? (
                      <div className="px-6 pb-5">
                        {jdText.length > 0 ? (
                          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                              <p className="font-medium text-emerald-800">JD loaded — {jdText.length.toLocaleString()} chars</p>
                            </div>
                            <button onClick={() => { setJdText(''); setAnalyzed(false); }}><X className="h-4 w-4 text-slate-400 hover:text-slate-600" /></button>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => { e.preventDefault(); setJdDragOver(true); }}
                            onDragLeave={() => setJdDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setJdDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleJdFile(f); }}
                            onClick={() => jdInputRef.current?.click()}
                            className={`rounded-xl border-2 border-dashed cursor-pointer px-8 py-10 text-center transition-all ${jdDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                          >
                            {extracting ? (
                              <div className="flex flex-col items-center gap-2">
                                <Spinner size="md" />
                                <p className="text-slate-500">Extracting text…</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6 text-slate-400" />
                                <p className="font-medium text-slate-700">Drop the JD file or click to browse</p>
                                <p className="text-sm text-slate-400">PDF or TXT</p>
                              </div>
                            )}
                          </div>
                        )}
                        <input ref={jdInputRef} type="file" accept=".pdf,.txt" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJdFile(f); e.target.value = ''; }} />
                      </div>
                    ) : (
                      <div className="px-6 pb-5">
                        <textarea value={jdText} onChange={(e) => { setJdText(e.target.value); if (analyzed) setAnalyzed(false); }}
                          placeholder="Paste the full job description here…" rows={10}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none leading-relaxed transition" />
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-sm ${jdReady ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                            {jdText.length} characters {jdReady ? '✓' : '(100 min)'}
                          </span>
                          {analyzed && (
                            <span className="text-sm text-indigo-500 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Auto-detected
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {(jdReady || analyzing) && (
                      <div className="border-t border-slate-100 px-6 py-5 space-y-4">
                        {analyzing && (
                          <div className="flex items-center gap-2 text-sm text-indigo-500">
                            <Spinner size="sm" /> Analysing job description…
                          </div>
                        )}
                        {analyzeError && (
                          <p className="text-sm text-amber-600 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" /> {analyzeError}
                          </p>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Job Title</label>
                            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                              placeholder="e.g. Senior Software Engineer"
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Company (optional)</label>
                            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. Capitec Bank"
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1.5">Industry</label>
                          <select value={industry} onChange={(e) => setIndustry(Number(e.target.value) as Industry)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition appearance-none">
                            {industryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep(1)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button onClick={() => { setMatchResult(null); setStep(3); }} disabled={!canStep3}
                      className="flex-1 flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-indigo-200">
                      {analyzing ? <><Spinner size="sm" className="text-white" />Detecting role…</> : <>Analyse Match <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Match & Generate */}
              {step === 3 && (
                <div className="space-y-5">
                  <button onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to job description
                  </button>

                  {matchLoading && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                      <Spinner size="lg" className="mx-auto mb-4" />
                      <p className="font-medium text-slate-700">Analysing your skills match…</p>
                      <p className="text-sm text-slate-400 mt-1">This takes a few seconds</p>
                    </div>
                  )}

                  {matchError && !matchLoading && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-800">{matchError}</p>
                        <button onClick={handleGenerate} disabled={generating}
                          className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                          {generating && <Spinner size="sm" className="text-white" />}
                          Generate anyway
                        </button>
                      </div>
                    </div>
                  )}

                  {matchResult && !matchLoading && (
                    <MatchPanel match={matchResult} onGenerate={handleGenerate} generating={generating} sessionError={sessionError} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Generated session ── */}
          {activeSession && (
            <div ref={sessionRef} className="animate-fade-in-up space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${industryColor[activeSession.industryName] ?? 'bg-indigo-100 text-indigo-700'}`}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">{activeSession.jobTitle}</h2>
                    <p className="text-sm text-slate-500">
                      {activeSession.companyName && `${activeSession.companyName} · `}
                      {activeSession.industryName} · {activeSession.concepts.length} concepts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/sessions/${activeSession.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    Full view <ChevronRight className="h-4 w-4" />
                  </Link>
                  <button onClick={resetSession}
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1">
                    <Plus className="h-4 w-4" /> New
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {activeSession.concepts.map((c, i) => <ConceptCard key={c.id} concept={c} index={i} />)}
              </div>
            </div>
          )}

          {/* ── Past sessions ── */}
          {pastSessions.length > 0 && (
            <section className="mt-10 space-y-4">
              <h2 className="font-semibold text-slate-700">
                Past Sessions
                <span className="ml-2 inline-flex items-center justify-center h-5 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                  {pastSessions.length}
                </span>
              </h2>
              {sessionsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((s, i) => (
                    <Link key={s.id} to={`/sessions/${s.id}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                      className="animate-fade-in-up group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${industryColor[s.industryName] ?? 'bg-slate-100 text-slate-500'}`}>
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.jobTitle}</p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {s.companyName && `${s.companyName} · `}{s.industryName} · {s.conceptCount} concepts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {!activeSession && sessions.length === 0 && cvReady && !cvLoading && step === 1 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <BookOpen className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-800">No sessions yet</p>
              <p className="mt-1.5 text-sm text-slate-500">Complete the steps above to generate your first prep session.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
