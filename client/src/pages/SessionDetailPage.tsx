import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { prepSessionApi } from '../services/api';
import { DifficultyBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { ConceptExplanationDto } from '../types/api';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, Lightbulb, Target, MessageSquare } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';

// Renders technical content: detects code blocks (lines starting with spaces + code chars)
// and pipe-tables (lines starting with |), renders the rest as paragraphs
function TechnicalContent({ text }: { text: string }) {
  const blocks: { type: 'para' | 'code' | 'table'; lines: string[] }[] = [];
  let current: { type: 'para' | 'code' | 'table'; lines: string[] } | null = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trimStart();
    const isCode = /^(public|private|var |await |return |if \(|async |\/\/|using |new |services\.|app\.)/.test(trimmed) || (line.startsWith('  ') && trimmed.length > 0 && !/^\|/.test(trimmed));
    const isTable = trimmed.startsWith('|');
    const type: 'code' | 'table' | 'para' = isCode ? 'code' : isTable ? 'table' : 'para';

    if (!current || current.type !== type) {
      if (current) blocks.push(current);
      current = { type, lines: [] };
    }
    current.lines.push(line);
  }
  if (current) blocks.push(current);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return (
            <pre key={i} className="rounded-lg bg-slate-900 text-slate-100 text-xs leading-relaxed p-4 overflow-x-auto font-mono">
              {block.lines.join('\n').trim()}
            </pre>
          );
        }
        if (block.type === 'table') {
          const rows = block.lines.filter((l) => l.includes('|'));
          const nonSepRows = rows.map((row, ri) => ({
            cells: row.split('|').slice(1, -1).map((c) => c.trim()),
            isHeader: ri === 0,
            isSep: row.split('|').slice(1, -1).map((c) => c.trim()).every((c) => /^[-:]+$/.test(c)),
            ri,
          })).filter((r) => !r.isSep);
          const headerRow = nonSepRows.find((r) => r.isHeader);
          const bodyRows = nonSepRows.filter((r) => !r.isHeader);
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                {headerRow && (
                  <thead>
                    <tr className="bg-slate-100">
                      {headerRow.cells.map((cell, ci) => (
                        <th key={ci} className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-700">{cell}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {bodyRows.map((row, bi) => (
                    <tr key={row.ri} className={bi % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="border border-slate-200 px-3 py-1.5 text-slate-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const joined = block.lines.join('\n').trim();
        if (!joined) return null;
        return (
          <div key={i} className="space-y-2">
            {joined.split('\n\n').filter(Boolean).map((para, pi) => (
              <p key={pi} className="text-sm text-gray-700 leading-relaxed">{para.trim()}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ConceptCard({ concept }: { concept: ConceptExplanationDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {concept.orderIndex}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{concept.topic}</span>
            <DifficultyBadge label={concept.difficultyName} />
          </div>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{concept.question}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {/* Plain English */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-700">
              <Lightbulb className="h-4 w-4" />
              Plain English
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{concept.plainEnglishExplanation}</p>
          </div>

          {/* Technical depth */}
          {concept.technicalDepth && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-700">
                <BookOpen className="h-4 w-4" />
                Technical Depth
              </div>
              <TechnicalContent text={concept.technicalDepth} />
            </div>
          )}

          {/* Industry context */}
          {concept.industryContext && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-green-700">
                <Target className="h-4 w-4" />
                Industry Context
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{concept.industryContext}</p>
            </div>
          )}

          {/* Suggested answer */}
          {concept.suggestedAnswer && (
            <div className="p-5 bg-indigo-50">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-indigo-800">
                <MessageSquare className="h-4 w-4" />
                Suggested Answer — say this out loud
              </div>
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

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['prep-sessions', id],
    queryFn: () => prepSessionApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Session not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>

        {/* Session header */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{session.jobTitle}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {session.companyName ? `${session.companyName} · ` : ''}
                {session.industryName} · {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {session.concepts.length} concepts
            </span>
          </div>
        </div>

        {/* Concepts */}
        <div className="space-y-3">
          {session.concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>

        {session.concepts.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
            No concepts generated for this session.
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/sessions/new')}>
            Start a new prep session
          </Button>
        </div>
      </div>
    </div>
  );
}
