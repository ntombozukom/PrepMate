import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileText } from 'lucide-react';
import { cvApi, cvToolsApi } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { AppMobileBar, AppSidebar } from '../components/AppNav';
import { AtsOptimizer, CoverLetterGenerator } from '../components/CvToolPanels';

type Tab = 'ats' | 'cover-letter';

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CvToolsPage() {
  const [tab, setTab] = useState<Tab>('ats');

  const { data: activeCv, isLoading: cvLoading } = useQuery({
    queryKey: ['cv', 'active'],
    queryFn: cvApi.getActive,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">

      <AppSidebar />
      <AppMobileBar />

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 px-5 py-8 mt-14 lg:mt-0 max-w-2xl mx-auto w-full">

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

              {tab === 'ats' && <AtsOptimizer run={() => cvToolsApi.optimizeAts(activeCv.id)} fileName={activeCv.fileName} />}
              {tab === 'cover-letter' && <CoverLetterGenerator generate={(input) => cvToolsApi.generateCoverLetter({ cvDocumentId: activeCv.id, ...input })} />}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
